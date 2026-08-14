-- =========================================================
-- SISIBAIK
-- Notifications
-- =========================================================


create type public.notification_type as enum (
  'reservation_created',
  'reservation_picked_up',
  'reservation_cancelled',
  'reservation_expired'
);


create table public.notifications (

  id uuid
    primary key
    default gen_random_uuid(),

  user_id uuid
    not null
    references public.profiles(id)
    on delete cascade,

  type public.notification_type
    not null,

  title text
    not null,

  message text
    not null,

  order_id uuid
    references public.orders(id)
    on delete cascade,

  target_path text,

  is_read boolean
    not null
    default false,

  read_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  constraint notification_order_event_unique
    unique (
      user_id,
      order_id,
      type
    )
);


create index notifications_user_idx
on public.notifications(
  user_id,
  created_at desc
);


create index notifications_unread_idx
on public.notifications(
  user_id,
  is_read,
  created_at desc
);

alter table public.notifications
enable row level security;

revoke all
on public.notifications
from anon, authenticated;

grant select
on public.notifications
to authenticated;

grant update (
  is_read,
  read_at
)
on public.notifications
to authenticated;

create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using (
  user_id =
    (select auth.uid())
);

create policy "Users can update own notifications"
on public.notifications
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

create or replace function public.notify_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_merchant_user_id uuid;

begin

  -- =======================================================
  -- MERCHANT OWNER
  -- =======================================================

  select merchant.user_id

  into v_merchant_user_id

  from public.merchant_profiles merchant

  where merchant.id =
    new.merchant_id;


  if v_merchant_user_id is null then

    return new;

  end if;


  -- =======================================================
  -- ORDER CREATED
  -- =======================================================

  if
    TG_OP = 'INSERT'
    and new.status =
      'reserved'::public.order_status
  then

    -- Merchant notification

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      v_merchant_user_id,

      'reservation_created'
        ::public.notification_type,

      'Reservasi baru masuk',

      'Ada reservasi makanan baru. Buka detail untuk melihat pesanan dan batas pengambilan.',

      new.id,

      '/merchant/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    -- Customer confirmation

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      new.customer_id,

      'reservation_created'
        ::public.notification_type,

      'Reservasi berhasil',

      'Makanan berhasil direservasi. Jangan lupa ambil sebelum batas waktu.',

      new.id,

      '/customer/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    return new;

  end if;


  -- =======================================================
  -- IGNORE UPDATE WITHOUT STATUS CHANGE
  -- =======================================================

  if
    TG_OP = 'UPDATE'
    and old.status =
        new.status
  then

    return new;

  end if;


  -- =======================================================
  -- PICKED UP
  -- =======================================================

  if
    new.status =
      'picked_up'::public.order_status
  then

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      new.customer_id,

      'reservation_picked_up'
        ::public.notification_type,

      'Pengambilan selesai',

      'Merchant telah mengonfirmasi bahwa makanan Anda sudah diambil.',

      new.id,

      '/customer/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    return new;

  end if;


  -- =======================================================
  -- CANCELLED
  -- =======================================================

  if
    new.status =
      'cancelled'::public.order_status
  then

    -- Notification customer

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      new.customer_id,

      'reservation_cancelled'
        ::public.notification_type,

      'Reservasi dibatalkan',

      'Reservasi makanan telah dibatalkan dan stok telah dikembalikan.',

      new.id,

      '/customer/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    -- Notification merchant

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      v_merchant_user_id,

      'reservation_cancelled'
        ::public.notification_type,

      'Reservasi dibatalkan',

      'Customer membatalkan reservasi. Stok produk telah dikembalikan.',

      new.id,

      '/merchant/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    return new;

  end if;


  -- =======================================================
  -- EXPIRED
  -- =======================================================

  if
    new.status =
      'expired'::public.order_status
  then

    -- Customer

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      new.customer_id,

      'reservation_expired'
        ::public.notification_type,

      'Reservasi kedaluwarsa',

      'Batas pengambilan reservasi telah berakhir.',

      new.id,

      '/customer/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    -- Merchant

    insert into public.notifications (

      user_id,
      type,
      title,
      message,
      order_id,
      target_path

    )
    values (

      v_merchant_user_id,

      'reservation_expired'
        ::public.notification_type,

      'Reservasi kedaluwarsa',

      'Reservasi melewati batas pengambilan dan stok telah dikembalikan.',

      new.id,

      '/merchant/orders/'
        || new.id::text

    )
    on conflict (
      user_id,
      order_id,
      type
    )
    do nothing;


    return new;

  end if;


  return new;

end;
$$;

revoke all
on function public.notify_order_event()
from public, anon, authenticated;

create trigger order_notification_trigger

after insert
or update of status

on public.orders

for each row

execute function public.notify_order_event();

alter publication supabase_realtime
add table public.notifications;