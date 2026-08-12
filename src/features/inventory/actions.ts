"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { stockAdjustmentSchema } from "./schemas";

export interface InventoryActionState {
  error?: string;
  success?: string;
}

export async function adjustStockAction(
  _previousState: InventoryActionState,

  formData: FormData,
): Promise<InventoryActionState> {
  await requireApprovedMerchant();

  const parsed = stockAdjustmentSchema.safeParse({
    productId: formData.get("productId"),

    quantityChange: formData.get("quantityChange"),

    activityType: formData.get("activityType"),

    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data stok tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("adjust_product_stock", {
    p_product_id: parsed.data.productId,

    p_quantity_change: parsed.data.quantityChange,

    p_activity_type: parsed.data.activityType,

    p_notes: parsed.data.notes || null,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/merchant/products");

  revalidatePath("/merchant/inventory");

  revalidatePath(`/merchant/inventory/${parsed.data.productId}`);

  return {
    success: `Stok berhasil diperbarui menjadi ${data}.`,
  };
}
