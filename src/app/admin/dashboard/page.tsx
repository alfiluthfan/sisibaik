import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminDashboardPage() {
  const profile =
    await requireRole("admin");

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Administrator
          </p>

          <h1 className="text-3xl font-bold">
            Halo, {profile.name}
          </h1>
        </div>

        <LogoutButton />
      </div>

      <section className="mt-10 rounded-xl border p-6">
        <h2 className="font-semibold">
          Admin Dashboard
        </h2>

        <p className="mt-2 text-gray-600">
          Verifikasi merchant dan organisasi
          akan dibuat berikutnya.
        </p>
      </section>
    </main>
  );
}