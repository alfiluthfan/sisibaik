"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/require-admin";

import { createClient } from "@/lib/supabase/server";

import { merchantReviewSchema } from "./schemas";

export interface MerchantReviewState {
  error?: string;
  success?: string;
}

export async function reviewMerchantAction(
  merchantId: string,
  _previousState: MerchantReviewState,
  formData: FormData,
): Promise<MerchantReviewState> {
  /*
   * Security check #1:
   * Next.js authorization.
   */
  await requireAdmin();

  const parsed = merchantReviewSchema.safeParse({
    decision: formData.get("decision"),

    rejectionReason: formData.get("rejectionReason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data verifikasi tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("review_merchant", {
    p_merchant_id: merchantId,

    p_decision: parsed.data.decision,

    p_rejection_reason: parsed.data.rejectionReason || null,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  /*
   * Refresh halaman admin.
   */
  revalidatePath("/admin/merchants");

  revalidatePath(`/admin/merchants/${merchantId}`);

  /*
   * Merchant yang sedang membuka
   * halaman verification juga harus
   * mendapatkan status terbaru.
   */
  revalidatePath("/merchant");

  revalidatePath("/merchant/verification");

  return {
    success:
      parsed.data.decision === "approved"
        ? "Merchant berhasil disetujui."
        : "Merchant berhasil ditolak.",
  };
}
