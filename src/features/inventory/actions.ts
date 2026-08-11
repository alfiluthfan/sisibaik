"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { requireMerchant } from "@/lib/merchant/get-merchant";

import { stockSchema } from "./schemas";

export async function adjustStockAction(formData: FormData) {
  await requireMerchant();

  const parsed = stockSchema.safeParse({
    productId: formData.get("productId"),

    quantityChange: formData.get("quantityChange"),

    activityType: formData.get("activityType"),

    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data stok tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data: newStock, error } = await supabase.rpc("adjust_product_stock", {
    p_product_id: parsed.data.productId,

    p_quantity_change: parsed.data.quantityChange,

    p_activity_type: parsed.data.activityType,

    p_notes: parsed.data.notes || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/merchant/products");

  revalidatePath("/merchant/inventory");

  revalidatePath(`/merchant/inventory/${parsed.data.productId}`);

  return {
    success: true,
    stock: newStock,
  };
}
