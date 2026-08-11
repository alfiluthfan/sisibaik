create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.user_role;
  profile_name text;
begin

  requested_role :=
    new.raw_user_meta_data ->> 'role';


  safe_role :=
    case requested_role

      when 'merchant'
        then 'merchant'::public.user_role

      when 'organization'
        then 'organization'::public.user_role

      else
        'customer'::public.user_role

    end;


  profile_name :=
    coalesce(
      nullif(
        trim(new.raw_user_meta_data ->> 'name'),
        ''
      ),
      split_part(
        coalesce(new.email, ''),
        '@',
        1
      ),
      'Pengguna'
    );


  insert into public.profiles (
    id,
    name,
    role,
    status
  )
  values (
    new.id,
    profile_name,
    safe_role,
    'active'::public.user_status
  );


  return new;
end;
$$;

create type public.merchant_verification_status
as enum (
  'pending',
  'approved',
  'rejected'
);


create table public.merchant_profiles (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null unique
    references public.profiles(id)
    on delete cascade,

  business_name text not null
    check (
      char_length(trim(business_name))
      between 2 and 150
    ),

  description text,

  phone text,

  address text not null,

  latitude double precision
    check (
      latitude is null
      or latitude between -90 and 90
    ),

  longitude double precision
    check (
      longitude is null
      or longitude between -180 and 180
    ),

  verification_status
    public.merchant_verification_status
    not null
    default 'pending',

  rejection_reason text,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);

create trigger on_merchant_profile_updated
before update on public.merchant_profiles
for each row
execute function public.handle_updated_at();

alter table public.merchant_profiles
enable row level security;

revoke all
on public.merchant_profiles
from anon, authenticated;


grant select
on public.merchant_profiles
to authenticated;


grant insert (
  user_id,
  business_name,
  description,
  phone,
  address,
  latitude,
  longitude
)
on public.merchant_profiles
to authenticated;


grant update (
  business_name,
  description,
  phone,
  address,
  latitude,
  longitude
)
on public.merchant_profiles
to authenticated;

create policy "Merchant can view own merchant profile"
on public.merchant_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
);

create policy "Merchant can create own merchant profile"
on public.merchant_profiles
for insert
to authenticated
with check (

  user_id = (select auth.uid())

  and exists (

    select 1
    from public.profiles

    where
      profiles.id =
        (select auth.uid())

      and profiles.role =
        'merchant'

      and profiles.status =
        'active'

  )

);

create policy "Merchant can update own merchant profile"
on public.merchant_profiles
for update
to authenticated
using (
  user_id =
    (select auth.uid())
)
with check (
  user_id =
    (select auth.uid())
);