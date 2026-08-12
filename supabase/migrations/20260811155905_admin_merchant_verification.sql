-- =========================================================
-- SISIBAIK
-- Admin Merchant Verification
-- =========================================================


alter table public.merchant_profiles
add column if not exists reviewed_by uuid
references public.profiles(id)
on delete set null;


alter table public.merchant_profiles
add column if not exists reviewed_at timestamptz;

create or replace function public.is_admin()
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
      and profile.role = 'admin'
      and profile.status = 'active'

  );

$$;

revoke all
on function public.is_admin()
from public;


grant execute
on function public.is_admin()
to authenticated;

create policy "Admin can view all profiles"
on public.profiles
for select
to authenticated
using (
  (select public.is_admin())
);

create policy "Admin can view all merchant profiles"
on public.merchant_profiles
for select
to authenticated
using (
  (select public.is_admin())
);

create or replace function public.review_merchant(
  p_merchant_id uuid,
  p_decision public.merchant_verification_status,
  p_rejection_reason text default null
)
returns public.merchant_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_result public.merchant_profiles;

begin

  -- =======================================================
  -- ADMIN CHECK
  -- =======================================================

  if not public.is_admin() then

    raise exception
      'Admin access required'
      using errcode = '42501';

  end if;


  -- =======================================================
  -- VALID DECISION
  -- =======================================================

  if p_decision not in (
    'approved'::public.merchant_verification_status,
    'rejected'::public.merchant_verification_status
  ) then

    raise exception
      'Invalid verification decision';

  end if;


  -- =======================================================
  -- REJECTION REQUIRES REASON
  -- =======================================================

  if
    p_decision = 'rejected'
    and nullif(
      trim(
        coalesce(
          p_rejection_reason,
          ''
        )
      ),
      ''
    ) is null
  then

    raise exception
      'Rejection reason is required';

  end if;


  -- =======================================================
  -- UPDATE
  -- =======================================================

  update public.merchant_profiles

  set

    verification_status =
      p_decision,

    rejection_reason =
      case

        when p_decision = 'rejected'
        then trim(p_rejection_reason)

        else null

      end,

    reviewed_by =
      (select auth.uid()),

    reviewed_at =
      now(),

    updated_at =
      now()

  where
    id = p_merchant_id

    /*
     * Merchant hanya dapat direview
     * sekali pada workflow MVP.
     *
     * Ini sekaligus mencegah dua admin
     * memproses merchant pending yang sama.
     */
    and verification_status = 'pending'

  returning *
  into v_result;


  if not found then

    raise exception
      'Merchant tidak ditemukan atau sudah diverifikasi';

  end if;


  return v_result;

end;
$$;

revoke all
on function public.review_merchant(
  uuid,
  public.merchant_verification_status,
  text
)
from public;


grant execute
on function public.review_merchant(
  uuid,
  public.merchant_verification_status,
  text
)
to authenticated;