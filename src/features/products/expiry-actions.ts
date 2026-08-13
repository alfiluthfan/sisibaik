"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

export async function reopenExpiredProductAction(
  productId: string,

  pickupDeadline: string,
) {
  await requireApprovedMerchant();

  const deadline = new Date(pickupDeadline);

  if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
    return {
      error: "Deadline baru tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("reopen_expired_product", {
    p_product_id: productId,

    p_pickup_deadline: deadline.toISOString(),
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/merchant/products");

  revalidatePath("/merchant/expiry");

  revalidatePath(`/merchant/products/${productId}/edit`);

  return {
    success: "Waktu penjualan berhasil diperpanjang.",
  };
}
