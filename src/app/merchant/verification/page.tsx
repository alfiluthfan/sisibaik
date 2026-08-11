import {
  redirect,
} from "next/navigation";

import {
  getMerchantContext,
} from "@/lib/merchant/get-merchant";

import {
  LogoutButton,
} from "@/features/auth/components/logout-button";


export default async function MerchantVerificationPage() {

  const {
    merchant,
  } =
    await getMerchantContext();


  if (!merchant) {

    redirect(
      "/merchant/onboarding"
    );

  }


  if (
    merchant.verification_status
    === "approved"
  ) {

    redirect(
      "/merchant/dashboard"
    );

  }


  const rejected =
    merchant.verification_status
    === "rejected";


  return (

    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">

      <section className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center">

        <div className="text-5xl">

          {rejected
            ? "❌"
            : "⏳"}

        </div>


        <h1 className="mt-5 text-2xl font-bold">

          {rejected
            ? "Verifikasi Ditolak"
            : "Menunggu Verifikasi"}

        </h1>


        <p className="mt-3 text-gray-600">

          {rejected
            ? "Data usaha Anda belum dapat disetujui."
            : "Data usaha Anda sedang diperiksa oleh administrator SisiBaik."}

        </p>


        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">

          <p className="text-sm text-gray-500">
            Nama Usaha
          </p>

          <p className="font-semibold">
            {merchant.business_name}
          </p>


          <p className="mt-4 text-sm text-gray-500">
            Status
          </p>

          <p className="font-semibold capitalize">
            {merchant.verification_status}
          </p>


          {rejected &&
           merchant.rejection_reason && (

            <>
              <p className="mt-4 text-sm text-gray-500">
                Alasan Penolakan
              </p>

              <p className="text-sm font-medium text-red-600">
                {merchant.rejection_reason}
              </p>
            </>

          )}

        </div>


        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>

      </section>

    </main>

  );
}