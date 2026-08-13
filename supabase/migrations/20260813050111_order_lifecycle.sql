alter table public.orders
add column if not exists pickup_verified_by uuid
references public.profiles(id)
on delete set null;


alter table public.orders
add column if not exists cancelled_by uuid
references public.profiles(id)
on delete set null;


alter table public.orders
add column if not exists cancellation_reason text;

alter type public.inventory_activity_type
add value if not exists 'reservation_expired';

create or replace function public.complete_order_pickup(
  p_order_id uuid,
  p_pickup_code text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid;

  v_order public.orders;

begin

  v_user_id :=
    (select auth.uid());


  if v_user_id is null then

    raise exception
      'Authentication required'
      using errcode = '42501';

  end if;


  -- =====================================================
  -- LOCK ORDER + CHECK MERCHANT OWNERSHIP
  -- =====================================================

  select order_record.*

  into v_order

  from public.orders order_record

  join public.merchant_profiles merchant
    on merchant.id =
       order_record.merchant_id

  join public.profiles profile
    on profile.id =
       merchant.user_id

  where
    order_record.id =
      p_order_id

    and merchant.user_id =
      v_user_id

    and merchant.verification_status =
      'approved'

    and profile.role =
      'merchant'

    and profile.status =
      'active'

  for update of order_record;


  if not found then

    raise exception
      'Order not found or access denied'
      using errcode = '42501';

  end if;


  -- =====================================================
  -- STATE
  -- =====================================================

  if
    v_order.status <>
      'reserved'::public.order_status
  then

    raise exception
      'Order is no longer reserved';

  end if;


  -- =====================================================
  -- DEADLINE
  -- =====================================================

  if
    v_order.pickup_deadline <= now()
  then

    raise exception
      'Reservation has expired';

  end if;


  -- =====================================================
  -- PICKUP CODE
  -- =====================================================

  if
    upper(
      trim(
        coalesce(
          p_pickup_code,
          ''
        )
      )
    )
    <>
    upper(v_order.pickup_code)
  then

    raise exception
      'Invalid pickup code';

  end if;


  -- =====================================================
  -- COMPLETE
  -- =====================================================

  update public.orders

  set
    status =
      'picked_up'::public.order_status,

    picked_up_at =
      now(),

    pickup_verified_by =
      v_user_id

  where id =
    p_order_id

  returning *
  into v_order;


  return v_order;

end;
$$;


revoke all
on function public.complete_order_pickup(
  uuid,
  text
)
from public;


grant execute
on function public.complete_order_pickup(
  uuid,
  text
)
to authenticated;

create or replace function public.cancel_reservation(
  p_order_id uuid,
  p_reason text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid;

  v_order public.orders;

  v_item record;

  v_previous_stock integer;
  v_current_stock integer;

begin

  v_user_id :=
    (select auth.uid());


  if v_user_id is null then

    raise exception
      'Authentication required'
      using errcode = '42501';

  end if;


  -- =====================================================
  -- CUSTOMER CHECK
  -- =====================================================

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


  -- =====================================================
  -- LOCK ORDER
  -- =====================================================

  select *

  into v_order

  from public.orders

  where
    id = p_order_id

    and customer_id =
      v_user_id

  for update;


  if not found then

    raise exception
      'Order not found or access denied'
      using errcode = '42501';

  end if;


  if
    v_order.status <>
      'reserved'::public.order_status
  then

    raise exception
      'Order cannot be cancelled';

  end if;


  /*
   * Setelah deadline, biarkan expiry
   * processor yang mengubahnya menjadi expired.
   */

  if
    v_order.pickup_deadline <= now()
  then

    raise exception
      'Reservation has already expired';

  end if;


  -- =====================================================
  -- RESTORE EACH PRODUCT
  -- =====================================================

  for v_item in

    select
      product_id,
      quantity

    from public.order_items

    where order_id =
      p_order_id

    order by product_id

  loop

    /*
     * Lock product.
     */

    select available_stock

    into v_previous_stock

    from public.products

    where id =
      v_item.product_id

    for update;


    if not found then

      raise exception
        'Reserved product not found';

    end if;


    v_current_stock :=
      v_previous_stock
      +
      v_item.quantity;


    update public.products

    set

      available_stock =
        v_current_stock,

      status =
        case

          when status =
            'archived'::public.product_status
          then
            status

          when pickup_deadline <= now()
          then
            'expired'::public.product_status

          when status =
            'sold_out'::public.product_status
          then
            'active'::public.product_status

          else
            status

        end

    where id =
      v_item.product_id;


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

      v_item.product_id,

      v_previous_stock,

      v_current_stock,

      v_item.quantity,

      'reservation_cancelled'
        ::public.inventory_activity_type,

      nullif(
        trim(
          coalesce(
            p_reason,
            ''
          )
        ),
        ''
      ),

      v_user_id

    );

  end loop;


  -- =====================================================
  -- CANCEL ORDER
  -- =====================================================

  update public.orders

  set

    status =
      'cancelled'::public.order_status,

    cancelled_at =
      now(),

    cancelled_by =
      v_user_id,

    cancellation_reason =
      nullif(
        trim(
          coalesce(
            p_reason,
            ''
          )
        ),
        ''
      )

  where id =
    p_order_id

  returning *
  into v_order;


  return v_order;

end;
$$;


revoke all
on function public.cancel_reservation(
  uuid,
  text
)
from public;


grant execute
on function public.cancel_reservation(
  uuid,
  text
)
to authenticated;

create or replace function public.expire_reservations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_order record;

  v_item record;

  v_previous_stock integer;
  v_current_stock integer;

  v_expired_count integer := 0;

begin

  /*
   * Process expired reserved orders one by one.
   */

  for v_order in

    select
      id,
      pickup_deadline

    from public.orders

    where
      status =
        'reserved'::public.order_status

      and pickup_deadline <= now()

    order by id

    for update skip locked

  loop

    for v_item in

      select
        product_id,
        quantity

      from public.order_items

      where order_id =
        v_order.id

      order by product_id

    loop

      select available_stock

      into v_previous_stock

      from public.products

      where id =
        v_item.product_id

      for update;


      if found then

        v_current_stock :=
          v_previous_stock
          +
          v_item.quantity;


        update public.products

        set

          available_stock =
            v_current_stock,

          status =
            case

              when status =
                'archived'::public.product_status
              then
                status

              when pickup_deadline <= now()
              then
                'expired'::public.product_status

              when status =
                'sold_out'::public.product_status
              then
                'active'::public.product_status

              else
                status

            end

        where id =
          v_item.product_id;


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

          v_item.product_id,

          v_previous_stock,

          v_current_stock,

          v_item.quantity,

          'reservation_expired'
            ::public.inventory_activity_type,

          'Reservation expired automatically',

          null

        );

      end if;

    end loop;


    update public.orders

    set status =
      'expired'::public.order_status

    where id =
      v_order.id;


    v_expired_count :=
      v_expired_count + 1;

  end loop;


  return v_expired_count;

end;
$$;


revoke all
on function public.expire_reservations()
from public, anon, authenticated;

select cron.schedule(

  'sisibaik-expire-reservations',

  '*/5 * * * *',

  'select public.expire_reservations();'

);