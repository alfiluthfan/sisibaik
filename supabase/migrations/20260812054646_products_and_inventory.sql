-- =========================================================
-- SISIBAIK
-- Products & Inventory
-- =========================================================


-- =========================================================
-- ENUMS
-- =========================================================

create type public.product_status as enum (
  'draft',
  'active',
  'sold_out',
  'expired',
  'archived'
);


create type public.inventory_activity_type as enum (
  'initial_stock',
  'restock',
  'manual_reduction',
  'adjustment',
  'reservation',
  'reservation_cancelled',
  'donation'
);


-- =========================================================
-- CATEGORIES
-- =========================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,

  slug text not null unique,

  is_active boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now()
);


-- =========================================================
-- PRODUCTS
-- =========================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),

  merchant_id uuid not null
    references public.merchant_profiles(id)
    on delete restrict,

  category_id uuid not null
    references public.categories(id)
    on delete restrict,

  name text not null
    check (
      char_length(trim(name))
      between 2 and 150
    ),

  description text,

  normal_price numeric(12, 2)
    not null
    check (normal_price > 0),

  surplus_price numeric(12, 2)
    not null
    check (
      surplus_price >= 0
      and surplus_price <= normal_price
    ),

  available_stock integer
    not null
    default 0
    check (available_stock >= 0),

  pickup_deadline timestamptz
    not null,

  status public.product_status
    not null
    default 'draft',

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);


create index products_merchant_id_idx
on public.products(merchant_id);

create index products_category_id_idx
on public.products(category_id);

create index products_status_idx
on public.products(status);

create index products_pickup_deadline_idx
on public.products(pickup_deadline);


create trigger on_product_updated
before update on public.products
for each row
execute function public.handle_updated_at();


-- =========================================================
-- INVENTORY LOGS
-- =========================================================

create table public.inventory_logs (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references public.products(id)
    on delete restrict,

  previous_stock integer
    not null
    check (previous_stock >= 0),

  current_stock integer
    not null
    check (current_stock >= 0),

  quantity_change integer
    not null,

  activity_type
    public.inventory_activity_type
    not null,

  notes text,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz
    not null
    default now()
);


create index inventory_logs_product_idx
on public.inventory_logs(product_id);

create index inventory_logs_created_at_idx
on public.inventory_logs(created_at desc);

create or replace function public.log_initial_product_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  insert into public.inventory_logs (
    product_id,
    previous_stock,
    current_stock,
    quantity_change,
    activity_type,
    created_by
  )
  values (
    new.id,
    0,
    new.available_stock,
    new.available_stock,
    'initial_stock'::public.inventory_activity_type,
    (select auth.uid())
  );


  return new;

end;
$$;


create trigger product_initial_stock_log
after insert on public.products
for each row
execute function public.log_initial_product_stock();

create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_quantity_change integer,
  p_activity_type public.inventory_activity_type,
  p_notes text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid;

  v_previous_stock integer;
  v_current_stock integer;

  v_previous_status public.product_status;

  v_deadline timestamptz;

begin

  v_user_id :=
    (select auth.uid());


  -- =======================================================
  -- AUTH
  -- =======================================================

  if v_user_id is null then

    raise exception
      'Authentication required'
      using errcode = '42501';

  end if;


  -- =======================================================
  -- VALIDATION
  -- =======================================================

  if p_quantity_change = 0 then

    raise exception
      'Quantity change cannot be zero';

  end if;


  /*
   * Hanya tipe manual yang boleh
   * dipanggil merchant.
   *
   * reservation/donation nanti punya
   * function bisnis sendiri.
   */
  if p_activity_type not in (

    'restock'
      ::public.inventory_activity_type,

    'manual_reduction'
      ::public.inventory_activity_type,

    'adjustment'
      ::public.inventory_activity_type

  ) then

    raise exception
      'Inventory activity type is not allowed';

  end if;


  if
    p_activity_type = 'restock'
    and p_quantity_change <= 0
  then

    raise exception
      'Restock quantity must be positive';

  end if;


  if
    p_activity_type = 'manual_reduction'
    and p_quantity_change >= 0
  then

    raise exception
      'Manual reduction must use negative quantity';

  end if;


  if
    p_activity_type = 'adjustment'
    and nullif(
      trim(
        coalesce(
          p_notes,
          ''
        )
      ),
      ''
    ) is null
  then

    raise exception
      'Adjustment requires notes';

  end if;


  -- =======================================================
  -- LOCK PRODUCT
  -- =======================================================

  select
    product.available_stock,
    product.status,
    product.pickup_deadline

  into
    v_previous_stock,
    v_previous_status,
    v_deadline

  from public.products product

  join public.merchant_profiles merchant
    on merchant.id =
       product.merchant_id

  join public.profiles profile
    on profile.id =
       merchant.user_id

  where
    product.id =
      p_product_id

    and merchant.user_id =
      v_user_id

    and merchant.verification_status =
      'approved'

    and profile.role =
      'merchant'

    and profile.status =
      'active'

  for update of product;


  if not found then

    raise exception
      'Product not found or access denied'
      using errcode = '42501';

  end if;


  -- =======================================================
  -- CALCULATE STOCK
  -- =======================================================

  v_current_stock :=
    v_previous_stock
    + p_quantity_change;


  if v_current_stock < 0 then

    raise exception
      'Insufficient stock';

  end if;


  -- =======================================================
  -- UPDATE PRODUCT
  -- =======================================================

  update public.products

  set

    available_stock =
      v_current_stock,

    status =
      case

        /*
         * Draft tidak otomatis active.
         */
        when v_previous_status = 'draft'
          then 'draft'
            ::public.product_status


        /*
         * Archived juga tidak otomatis
         * dipublikasikan.
         */
        when v_previous_status = 'archived'
          then 'archived'
            ::public.product_status


        /*
         * Deadline lewat.
         */
        when v_deadline <= now()
          then 'expired'
            ::public.product_status


        /*
         * Stock habis.
         */
        when v_current_stock = 0
          then 'sold_out'
            ::public.product_status


        /*
         * Restock produk sold out.
         */
        when
          v_previous_status = 'sold_out'
          and v_current_stock > 0
        then
          'active'
            ::public.product_status


        else
          v_previous_status

      end

  where id =
    p_product_id;


  -- =======================================================
  -- INVENTORY LOG
  -- =======================================================

  insert into public.inventory_logs (
    product_id,
    previous_stock,
    current_stock,
    quantity_change,
    activity_type,
    notes,
    created_by
  )
  values (
    p_product_id,
    v_previous_stock,
    v_current_stock,
    p_quantity_change,
    p_activity_type,
    nullif(
      trim(p_notes),
      ''
    ),
    v_user_id
  );


  return
    v_current_stock;

end;
$$;

alter table public.categories
enable row level security;

alter table public.products
enable row level security;

alter table public.inventory_logs
enable row level security;

grant select
on public.categories
to authenticated;


create policy "Authenticated can view active categories"
on public.categories
for select
to authenticated
using (
  is_active = true
);

revoke all
on public.products
from anon, authenticated;


grant select
on public.products
to authenticated;

grant update (
  category_id,
  name,
  description,
  normal_price,
  surplus_price,
  pickup_deadline,
  status
)
on public.products
to authenticated;

create policy "Merchant can view own products"
on public.products
for select
to authenticated
using (

  merchant_id in (

    select merchant.id

    from public.merchant_profiles merchant

    where merchant.user_id =
      (select auth.uid())

  )

);

create policy "Approved merchant can create products"
on public.products
for insert
to authenticated
with check (

  merchant_id in (

    select merchant.id

    from public.merchant_profiles merchant

    join public.profiles profile
      on profile.id =
         merchant.user_id

    where
      merchant.user_id =
        (select auth.uid())

      and merchant.verification_status =
        'approved'

      and profile.role =
        'merchant'

      and profile.status =
        'active'

  )

);

create policy "Approved merchant can update own products"
on public.products
for update
to authenticated
using (

  merchant_id in (

    select merchant.id

    from public.merchant_profiles merchant

    where
      merchant.user_id =
        (select auth.uid())

      and merchant.verification_status =
        'approved'

  )

)
with check (

  merchant_id in (

    select merchant.id

    from public.merchant_profiles merchant

    where
      merchant.user_id =
        (select auth.uid())

      and merchant.verification_status =
        'approved'

  )

);

revoke all
on public.inventory_logs
from anon, authenticated;


grant select
on public.inventory_logs
to authenticated;


create policy "Merchant can view own inventory logs"
on public.inventory_logs
for select
to authenticated
using (

  exists (

    select 1

    from public.products product

    join public.merchant_profiles merchant
      on merchant.id =
         product.merchant_id

    where
      product.id =
        inventory_logs.product_id

      and merchant.user_id =
        (select auth.uid())

  )

);

revoke all
on function public.adjust_product_stock(
  uuid,
  integer,
  public.inventory_activity_type,
  text
)
from public;


grant execute
on function public.adjust_product_stock(
  uuid,
  integer,
  public.inventory_activity_type,
  text
)
to authenticated;

insert into public.categories (
  name,
  slug
)
values
  (
    'Makanan Berat',
    'makanan-berat'
  ),
  (
    'Roti & Bakery',
    'roti-bakery'
  ),
  (
    'Camilan',
    'camilan'
  ),
  (
    'Minuman',
    'minuman'
  ),
  (
    'Buah & Sayur',
    'buah-sayur'
  ),
  (
    'Lainnya',
    'lainnya'
  )
on conflict (slug)
do nothing;