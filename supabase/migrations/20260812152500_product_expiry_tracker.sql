-- =========================================================
-- SISIBAIK
-- Product Expiry Tracker
-- =========================================================


-- =========================================================
-- EXPIRE PRODUCTS
-- =========================================================

create or replace function public.expire_products()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_updated_count integer;

begin

  update public.products

  set
    status =
      'expired'::public.product_status,

    updated_at =
      now()

  where
    pickup_deadline <= now()

    and status in (
      'active'::public.product_status,
      'sold_out'::public.product_status
    );


  get diagnostics
    v_updated_count = row_count;


  return v_updated_count;

end;
$$;


-- =========================================================
-- PERMISSIONS
-- =========================================================

revoke all
on function public.expire_products()
from public;

revoke all
on function public.expire_products()
from anon;

revoke all
on function public.expire_products()
from authenticated;

create or replace function public.reopen_expired_product(
  p_product_id uuid,
  p_pickup_deadline timestamptz
)
returns public.products
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid;

  v_product public.products;

begin

  v_user_id =
    (select auth.uid());


  if v_user_id is null then

    raise exception
      'Authentication required'
      using errcode = '42501';

  end if;


  if
    p_pickup_deadline <= now()
  then

    raise exception
      'New deadline must be in the future';

  end if;


  update public.products product

  set

    pickup_deadline =
      p_pickup_deadline,

    status =
      case

        when product.available_stock > 0
        then
          'active'::public.product_status

        else
          'sold_out'::public.product_status

      end,

    updated_at =
      now()

  from public.merchant_profiles merchant

  where
    product.id =
      p_product_id

    and product.status =
      'expired'

    and merchant.id =
      product.merchant_id

    and merchant.user_id =
      v_user_id

    and merchant.verification_status =
      'approved'

  returning product.*
  into v_product;


  if not found then

    raise exception
      'Expired product not found or access denied'
      using errcode = '42501';

  end if;


  return v_product;

end;
$$;


revoke all
on function public.reopen_expired_product(
  uuid,
  timestamptz
)
from public;


grant execute
on function public.reopen_expired_product(
  uuid,
  timestamptz
)
to authenticated;