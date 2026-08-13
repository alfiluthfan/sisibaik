"use server";

import { revalidatePath } from "next/cache";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { pickupVerificationSchema } from "./schemas";

export interface PickupActionState {
  error?: string;
  success?: string;
}

export async function completePickupAction(
  orderId: string,

  _previousState: PickupActionState,

  formData: FormData,
): Promise<PickupActionState> {
  /*
   * Security check Next.js.
   */

  await requireApprovedMerchant();

  const parsed = pickupVerificationSchema.safeParse({
    pickupCode: formData.get("pickupCode"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Pickup code tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("complete_order_pickup", {
    p_order_id: orderId,

    p_pickup_code: parsed.data.pickupCode,
  });

  if (error) {
    if (error.message.includes("Invalid pickup code")) {
      return {
        error: "Pickup code tidak sesuai.",
      };
    }

    if (error.message.includes("expired")) {
      return {
        error: "Reservasi sudah melewati batas pengambilan.",
      };
    }

    if (error.message.includes("no longer reserved")) {
      return {
        error: "Reservasi sudah tidak aktif.",
      };
    }

    return {
      error: "Gagal menyelesaikan pickup.",
    };
  }

  revalidatePath("/merchant/orders");

  revalidatePath(`/merchant/orders/${orderId}`);

  revalidatePath("/customer/orders");

  revalidatePath(`/customer/orders/${orderId}`);

  return {
    success: "Pickup berhasil diverifikasi.",
  };
}
