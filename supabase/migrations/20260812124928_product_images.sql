-- =========================================================
-- SISIBAIK
-- Product Images
-- =========================================================


alter table public.products
add column image_path text;


/*
 * image_path sengaja TIDAK diberikan sebagai
 * direct update permission kepada authenticated.
 *
 * Update akan melalui RPC set_product_image().
 */

 create or replace function public.set_product_image(
  p_product_id uuid,
  p_image_path text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid;
  v_old_image_path text;

begin

  v_user_id :=
    (select auth.uid());


  if v_user_id is null then

    raise exception
      'Authentication required'
      using errcode = '42501';

  end if;


  /*
   * Pastikan produk memang dimiliki
   * merchant yang sedang login.
   */

  select product.image_path

  into v_old_image_path

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
      'active';


  if not found then

    raise exception
      'Product not found or access denied'
      using errcode = '42501';

  end if;


  /*
   * Jika image tidak null, path HARUS:
   *
   * USER_UUID/PRODUCT_UUID/file
   */

  if
    p_image_path is not null
    and (
      char_length(p_image_path) > 500

      or p_image_path not like
        v_user_id::text
        || '/'
        || p_product_id::text
        || '/%'
    )
  then

    raise exception
      'Invalid product image path';

  end if;


  update public.products

  set image_path =
    p_image_path

  where id =
    p_product_id;


  /*
   * Return image lama.
   *
   * Server Action akan menghapus
   * file lama setelah database berhasil.
   */

  return v_old_image_path;

end;
$$;


revoke all
on function public.set_product_image(
  uuid,
  text
)
from public;


grant execute
on function public.set_product_image(
  uuid,
  text
)
to authenticated;

-- =========================================================
-- STORAGE INSERT
-- =========================================================

create policy "Approved merchant can upload product images"
on storage.objects
for insert
to authenticated
with check (

  bucket_id = 'product-images'

  and
  (storage.foldername(name))[1]
    = (select auth.uid()::text)

  and exists (

    select 1

    from public.merchant_profiles merchant

    where
      merchant.user_id =
        (select auth.uid())

      and merchant.verification_status =
        'approved'

  )

);

create policy "Merchant can select own product image objects"
on storage.objects
for select
to authenticated
using (

  bucket_id =
    'product-images'

  and owner_id =
    (select auth.uid()::text)

);

create policy "Merchant can delete own product images"
on storage.objects
for delete
to authenticated
using (

  bucket_id =
    'product-images'

  and owner_id =
    (select auth.uid()::text)

);

