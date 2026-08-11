import { redirect } from "next/navigation";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireAuth } from "@/lib/auth/guards";

export default async function AccountSuspendedPage() {
  const profile =
    await requireAuth();

  if (
    profile.status !== "suspended"
  ) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">
          Akun Dinonaktifkan
        </h1>

        <p className="mt-3 text-gray-600">
          Akun SisiBaik milikmu saat ini
          sedang dinonaktifkan.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Hubungi administrator jika kamu
          merasa status ini tidak sesuai.
        </p>

        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}