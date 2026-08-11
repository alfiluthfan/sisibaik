import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { redirect } from "next/navigation";


export async function getMerchantContext() {
  const profile =
    await requireRole("merchant");

  const supabase =
    await createClient();


  const {
    data: merchant,
    error,
  } = await supabase
    .from("merchant_profiles")
    .select(`
      id,
      user_id,
      business_name,
      description,
      phone,
      address,
      latitude,
      longitude,
      verification_status,
      rejection_reason,
      created_at,
      updated_at
    `)
    .eq(
      "user_id",
      profile.id
    )
    .maybeSingle();


  if (error) {
    throw new Error(
      "Gagal mengambil data merchant."
    );
  }


  return {
    profile,
    merchant,
  };
}

export async function requireApprovedMerchant() {
  const {
    profile,
    merchant,
  } = await getMerchantContext();


  if (!merchant) {
    redirect(
      "/merchant/onboarding"
    );
  }


  if (
    merchant.verification_status
    === "pending"
  ) {
    redirect(
      "/merchant/verification"
    );
  }


  if (
    merchant.verification_status
    === "rejected"
  ) {
    redirect(
      "/merchant/verification"
    );
  }


  return {
    profile,
    merchant,
  };
}