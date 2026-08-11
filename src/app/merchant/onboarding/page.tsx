import {
  redirect,
} from "next/navigation";

import {
  getMerchantContext,
} from "@/lib/merchant/get-merchant";

import {
  MerchantOnboardingForm,
} from "@/features/merchant/components/merchant-onboarding-form";


export default async function MerchantOnboardingPage() {

  const {
    profile,
    merchant,
  } =
    await getMerchantContext();


  /*
   * Sudah onboarding,
   * jangan isi ulang.
   */
  if (merchant) {

    redirect(
      "/merchant"
    );

  }


  return (

    <main className="min-h-screen bg-gray-50 px-4 py-12">

      <div className="mx-auto max-w-2xl">

        <div>

          <p className="text-sm font-medium text-gray-500">
            Merchant Onboarding
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Daftarkan UMKM Anda
          </h1>

          <p className="mt-3 text-gray-600">
            Halo {profile.name}, lengkapi
            informasi usaha sebelum mulai
            menjual makanan surplus di
            SisiBaik.
          </p>

        </div>


        <section className="mt-8 rounded-2xl border bg-white p-7">

          <MerchantOnboardingForm />

        </section>

      </div>

    </main>

  );
}