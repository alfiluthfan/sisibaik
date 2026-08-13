import type { SupabaseClient } from "@supabase/supabase-js";

import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage/product-images";

export function getProductImageUrl(
  supabase: SupabaseClient,
  imagePath: string | null,
) {
  if (!imagePath) {
    return null;
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl;
}
