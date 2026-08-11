import { redirect } from "next/navigation";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireAuth } from "@/lib/auth/guards";

export default async function PendingVerificationPage() {
  const profile =
    await requireAuth();

  if (
    profile.status === "active"
  ) {
    redirect("/dashboard");
  }

  if (
    profile.status === "suspended"
  ) {
    redirect(
      "/account-suspended"
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">
          ⏳
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Menunggu Verifikasi
        </h1>

        <p className="mt-3 text-gray-600">
          Halo {profile.name}, akunmu
          sedang menunggu verifikasi
          administrator SisiBaik.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Kamu akan dapat mengakses
          dashboard setelah akun disetujui.
        </p>

        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}