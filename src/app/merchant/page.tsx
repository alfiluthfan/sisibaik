import {
  redirect,
} from "next/navigation";

import {
  getMerchantContext,
} from "@/lib/merchant/get-merchant";


export default async function MerchantPage() {

  const {
    merchant,
  } =
    await getMerchantContext();


  /*
   * Belum mengisi data UMKM.
   */
  if (!merchant) {
    redirect(
      "/merchant/onboarding"
    );
  }


  /*
   * Sedang menunggu admin.
   */
  if (
    merchant.verification_status
    === "pending"
  ) {
    redirect(
      "/merchant/verification"
    );
  }


  /*
   * Ditolak admin.
   */
  if (
    merchant.verification_status
    === "rejected"
  ) {
    redirect(
      "/merchant/verification"
    );
  }


  /*
   * Approved.
   */
  redirect(
    "/merchant/dashboard"
  );
}