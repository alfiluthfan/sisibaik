import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireRole } from "@/lib/auth/guards";

export default async function CustomerDashboardPage() {
  const profile =
    await requireRole("customer");

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Customer Dashboard
          </p>

          <h1 className="text-3xl font-bold">
            Halo, {profile.name}
          </h1>
        </div>

        <LogoutButton />
      </div>

      <section className="mt-10 rounded-xl border p-6">
        <h2 className="font-semibold">
          Selamat datang di SisiBaik
        </h2>

        <p className="mt-2 text-gray-600">
          Marketplace makanan surplus
          akan muncul di sini.
        </p>
      </section>
    </main>
  );
}