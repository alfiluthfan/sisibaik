"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { cancelReservationSchema } from "./schemas";

export interface CancelReservationState {
  error?: string;
  success?: string;
}

export async function cancelReservationAction(
  orderId: string,

  _previousState: CancelReservationState,

  formData: FormData,
): Promise<CancelReservationState> {
  await requireRole("customer");

  const parsed = cancelReservationSchema.safeParse({
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_reservation", {
    p_order_id: orderId,

    p_reason: parsed.data.reason || null,
  });

  if (error) {
    if (error.message.includes("already expired")) {
      return {
        error: "Reservasi sudah kedaluwarsa.",
      };
    }

    if (error.message.includes("cannot be cancelled")) {
      return {
        error: "Reservasi sudah tidak dapat dibatalkan.",
      };
    }

    return {
      error: "Gagal membatalkan reservasi.",
    };
  }

  revalidatePath("/customer/orders");

  revalidatePath(`/customer/orders/${orderId}`);

  revalidatePath("/marketplace");

  revalidatePath("/merchant/orders");

  return {
    success: "Reservasi berhasil dibatalkan.",
  };
}
