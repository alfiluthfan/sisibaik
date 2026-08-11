import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { LogoutButton } from "@/features/auth/components/logout-button";

export default async function MerchantDashboardPage() {
  const { profile, merchant } = await requireApprovedMerchant();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Mitra UMKM</p>

          <h1 className="text-3xl font-bold">{merchant.business_name}</h1>

          <p className="mt-1 text-gray-500">Halo, {profile.name}</p>
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}
