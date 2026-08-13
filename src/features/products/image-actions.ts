"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage/product-images";

interface ProductImageResult {
  success?: string;
  error?: string;
}

export async function setProductImageAction(
  productId: string,
  imagePath: string,
): Promise<ProductImageResult> {
  const { profile } = await requireApprovedMerchant();

  /*
   * Security validation tambahan
   * di Next.js.
   *
   * Database RPC juga melakukan
   * validasi yang sama.
   */

  const requiredPrefix = `${profile.id}/${productId}/`;

  if (!imagePath.startsWith(requiredPrefix)) {
    return {
      error: "Path gambar tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data: oldImagePath, error } = await supabase.rpc(
    "set_product_image",
    {
      p_product_id: productId,

      p_image_path: imagePath,
    },
  );

  if (error) {
    return {
      error: error.message,
    };
  }

  /*
   * Database sudah menunjuk ke image baru.
   * Sekarang hapus image lama.
   */

  if (oldImagePath && oldImagePath !== imagePath) {
    const { error: removeError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([oldImagePath]);

    /*
     * Jangan rollback DB hanya
     * karena cleanup file lama gagal.
     *
     * Worst case hanya orphan file.
     */

    if (removeError) {
      console.error("Failed to remove old product image:", removeError.message);
    }
  }

  revalidatePath("/merchant/products");

  revalidatePath(`/merchant/products/${productId}/edit`);

  return {
    success: "Foto produk berhasil diperbarui.",
  };
}

export async function removeProductImageAction(
  productId: string,
): Promise<ProductImageResult> {
  await requireApprovedMerchant();

  const supabase = await createClient();

  /*
   * Set image_path = null.
   *
   * RPC mengembalikan old path.
   */

  const { data: oldImagePath, error } = await supabase.rpc(
    "set_product_image",
    {
      p_product_id: productId,

      p_image_path: null,
    },
  );

  if (error) {
    return {
      error: error.message,
    };
  }

  if (oldImagePath) {
    const { error: removeError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([oldImagePath]);

    if (removeError) {
      console.error(removeError.message);
    }
  }

  revalidatePath("/merchant/products");

  revalidatePath(`/merchant/products/${productId}/edit`);

  return {
    success: "Foto produk berhasil dihapus.",
  };
}
