-- =========================================================
-- SISIBAIK
-- Marketplace Access
-- =========================================================


-- =========================================================
-- CUSTOMER HELPER
-- =========================================================

create or replace function public.is_customer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$

  select exists (

    select 1
    from public.profiles profile

    where
      profile.id = (select auth.uid())

      and profile.role =
        'customer'

      and profile.status =
        'active'

  );

$$;


revoke all
on function public.is_customer()
from public;


grant execute
on function public.is_customer()
to authenticated;

create policy "Customer can view approved merchants"
on public.merchant_profiles
for select
to authenticated
using (

  (select public.is_customer())

  and verification_status =
    'approved'

);

create policy "Customer can view marketplace products"
on public.products
for select
to authenticated
using (

  (select public.is_customer())

  and status =
    'active'

  and available_stock > 0

  and pickup_deadline > now()

  and exists (

    select 1

    from public.merchant_profiles merchant

    where
      merchant.id =
        products.merchant_id

      and merchant.verification_status =
        'approved'

  )

);