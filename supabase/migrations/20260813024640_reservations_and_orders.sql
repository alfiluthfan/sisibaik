-- =========================================================
-- SISIBAIK
-- Reservations & Orders
-- =========================================================


-- =========================================================
-- ENUM
-- =========================================================

create type public.order_status as enum (
  'reserved',
  'picked_up',
  'cancelled',
  'expired'
);


-- =========================================================
-- ORDERS
-- =========================================================

create table public.orders (

  id uuid
    primary key
    default gen_random_uuid(),

  customer_id uuid
    not null
    references public.profiles(id)
    on delete restrict,

  merchant_id uuid
    not null
    references public.merchant_profiles(id)
    on delete restrict,

  status public.order_status
    not null
    default 'reserved',

  total_amount numeric(12, 2)
    not null
    check (total_amount >= 0),

  pickup_code varchar(8)
    not null
    unique,

  pickup_deadline timestamptz
    not null,

  reserved_at timestamptz
    not null
    default now(),

  picked_up_at timestamptz,

  cancelled_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);


create index orders_customer_id_idx
on public.orders(customer_id);


create index orders_merchant_id_idx
on public.orders(merchant_id);


create index orders_status_idx
on public.orders(status);


create index orders_pickup_code_idx
on public.orders(pickup_code);


create trigger on_order_updated
before update on public.orders
for each row
execute function public.handle_updated_at();


-- =========================================================
-- ORDER ITEMS
-- =========================================================

create table public.order_items (

  id uuid
    primary key
    default gen_random_uuid(),

  order_id uuid
    not null
    references public.orders(id)
    on delete cascade,

  product_id uuid
    not null
    references public.products(id)
    on delete restrict,

  product_name text
    not null,

  unit_price numeric(12, 2)
    not null
    check (unit_price >= 0),

  quantity integer
    not null
    check (quantity > 0),

  subtotal numeric(12, 2)
    not null
    check (subtotal >= 0),

  created_at timestamptz
    not null
    default now()
);


create index order_items_order_id_idx
on public.order_items(order_id);


create index order_items_product_id_idx
on public.order_items(product_id);

alter table public.orders
enable row level security;

alter table public.order_items
enable row level security;

revoke all
on public.orders
from anon, authenticated;


revoke all
on public.order_items
from anon, authenticated;


grant select
on public.orders
to authenticated;


grant select
on public.order_items
to authenticated;

create policy "Customer can view own orders"
on public.orders
for select
to authenticated
using (
  customer_id =
    (select auth.uid())
);

create policy "Merchant can view own merchant orders"
on public.orders
for select
to authenticated
using (

  merchant_id in (

    select merchant.id

    from public.merchant_profiles merchant

    where
      merchant.user_id =
        (select auth.uid())

  )

);

create policy "Users can view accessible order items"
on public.order_items
for select
to authenticated
using (

  exists (

    select 1

    from public.orders order_record

    where
      order_record.id =
        order_items.order_id

      and (

        order_record.customer_id =
          (select auth.uid())

        or

        order_record.merchant_id in (

          select merchant.id

          from public.merchant_profiles merchant

          where
            merchant.user_id =
              (select auth.uid())

        )

      )

  )

);

create or replace function public.reserve_product(
  p_product_id uuid,
  p_quantity integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid;

  v_product record;

  v_previous_stock integer;
  v_current_stock integer;

  v_order_id uuid;

  v_total_amount numeric(12, 2);

  v_pickup_code varchar(8);

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


  if not exists (

    select 1

    from public.profiles profile

    where
      profile.id =
        v_user_id

      and profile.role =
        'customer'

      and profile.status =
        'active'

  ) then

    raise exception
      'Customer access required'
      using errcode = '42501';

  end if;


  -- =======================================================
  -- QUANTITY
  -- =======================================================

  if
    p_quantity is null
    or p_quantity <= 0
    or p_quantity > 20
  then

    raise exception
      'Invalid reservation quantity';

  end if;


  -- =======================================================
  -- LOCK PRODUCT
  -- =======================================================

  select

    product.id,
    product.name,
    product.merchant_id,

    product.surplus_price,

    product.available_stock,

    product.pickup_deadline,

    product.status

  into
    v_product

  from public.products product

  join public.merchant_profiles merchant
    on merchant.id =
       product.merchant_id

  where
    product.id =
      p_product_id

    and merchant.verification_status =
      'approved'

  for update of product;


  if not found then

    raise exception
      'Product not found';

  end if;


  -- =======================================================
  -- PRODUCT VALIDATION
  -- =======================================================

  if
    v_product.status
      <> 'active'::public.product_status
  then

    raise exception
      'Product is not available';

  end if;


  if
    v_product.pickup_deadline
      <= now()
  then

    raise exception
      'Product pickup deadline has passed';

  end if;


  if
    v_product.available_stock
      < p_quantity
  then

    raise exception
      'Insufficient stock';

  end if;


  -- =======================================================
  -- STOCK
  -- =======================================================

  v_previous_stock :=
    v_product.available_stock;


  v_current_stock :=
    v_previous_stock
    -
    p_quantity;


  v_total_amount :=
    v_product.surplus_price
    *
    p_quantity;


  -- =======================================================
  -- PICKUP CODE
  -- =======================================================

  loop

    v_pickup_code :=
      upper(
        substr(
          replace(
            gen_random_uuid()::text,
            '-',
            ''
          ),
          1,
          8
        )
      );


    exit when not exists (

      select 1

      from public.orders

      where pickup_code =
        v_pickup_code

    );

  end loop;


  -- =======================================================
  -- ORDER
  -- =======================================================

  insert into public.orders (

    customer_id,

    merchant_id,

    status,

    total_amount,

    pickup_code,

    pickup_deadline

  )
  values (

    v_user_id,

    v_product.merchant_id,

    'reserved'::public.order_status,

    v_total_amount,

    v_pickup_code,

    v_product.pickup_deadline

  )

  returning id
  into v_order_id;


  -- =======================================================
  -- ORDER ITEM
  -- =======================================================

  insert into public.order_items (

    order_id,

    product_id,

    product_name,

    unit_price,

    quantity,

    subtotal

  )
  values (

    v_order_id,

    v_product.id,

    v_product.name,

    v_product.surplus_price,

    p_quantity,

    v_total_amount

  );


  -- =======================================================
  -- UPDATE PRODUCT STOCK
  -- =======================================================

  update public.products

  set

    available_stock =
      v_current_stock,

    status =
      case

        when v_current_stock = 0
        then
          'sold_out'::public.product_status

        else
          status

      end

  where id =
    v_product.id;


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

    v_product.id,

    v_previous_stock,

    v_current_stock,

    -p_quantity,

    'reservation'
      ::public.inventory_activity_type,

    'Reserved through marketplace',

    v_user_id

  );


  return
    v_order_id;

end;
$$;

revoke all
on function public.reserve_product(
  uuid,
  integer
)
from public;


grant execute
on function public.reserve_product(
  uuid,
  integer
)
to authenticated;