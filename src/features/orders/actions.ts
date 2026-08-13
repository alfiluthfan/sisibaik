"use server";

import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { reservationSchema } from "./schemas";

export interface ReservationState {
  error?: string;
}

export async function reserveProductAction(
  productId: string,

  _previousState: ReservationState,

  formData: FormData,
): Promise<ReservationState> {
  /*
   * Server Actions harus tetap
   * melakukan authorization.
   */
  await requireRole("customer");

  const parsed = reservationSchema.safeParse({
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Jumlah reservasi tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data: orderId, error } = await supabase.rpc("reserve_product", {
    p_product_id: productId,

    p_quantity: parsed.data.quantity,
  });

  if (error) {
    const message = error.message;

    if (message.includes("Insufficient stock")) {
      return {
        error: "Stok produk tidak mencukupi.",
      };
    }

    if (message.includes("deadline")) {
      return {
        error: "Waktu reservasi produk telah berakhir.",
      };
    }

    if (message.includes("not available")) {
      return {
        error: "Produk sudah tidak tersedia.",
      };
    }

    return {
      error: "Reservasi gagal. Silakan coba kembali.",
    };
  }

  revalidatePath("/marketplace");

  revalidatePath(`/marketplace/${productId}`);

  revalidatePath("/customer/orders");

  redirect(`/customer/orders/${orderId}`);
}
