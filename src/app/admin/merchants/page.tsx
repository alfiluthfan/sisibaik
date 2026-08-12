import Link from "next/link";

import { requireAdmin } from "@/lib/admin/require-admin";

import { createClient } from "@/lib/supabase/server";

import { MerchantStatusBadge } from "@/features/admin/merchant-verification/components/merchant-status-badge";

interface AdminMerchantPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

const validStatuses = ["pending", "approved", "rejected"] as const;

export default async function AdminMerchantsPage({
  searchParams,
}: AdminMerchantPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const selectedStatus = validStatuses.includes(
    params.status as (typeof validStatuses)[number],
  )
    ? params.status
    : "pending";

  const supabase = await createClient();

  const query = supabase
    .from("merchant_profiles")
    .select(
      `
        id,
        user_id,
        business_name,
        phone,
        address,
        verification_status,
        created_at,
        reviewed_at
      `,
    )
    .eq("verification_status", selectedStatus)
    .order("created_at", {
      ascending: false,
    });

  const { data: merchants, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil merchant: ${error.message}`);
  }

  return (
    <main className="p-8">
      {/* HEADER */}

      <div>
        <p className="text-sm text-gray-500">Administrator</p>

        <h1 className="text-3xl font-bold">Verifikasi Merchant</h1>

        <p className="mt-2 text-gray-600">
          Tinjau pengajuan UMKM yang ingin bergabung dengan SisiBaik.
        </p>
      </div>

      {/* FILTER */}

      <div className="mt-8 flex gap-2">
        <Link
          href="/admin/merchants?status=pending"
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Menunggu
        </Link>

        <Link
          href="/admin/merchants?status=approved"
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Disetujui
        </Link>

        <Link
          href="/admin/merchants?status=rejected"
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Ditolak
        </Link>
      </div>

      {/* TABLE */}

      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Nama Usaha</th>

              <th className="p-4 text-left">Telepon</th>

              <th className="p-4 text-left">Alamat</th>

              <th className="p-4 text-left">Status</th>

              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {merchants?.map((merchant) => (
              <tr key={merchant.id} className="border-t">
                <td className="p-4 font-medium">{merchant.business_name}</td>

                <td className="p-4 text-sm text-gray-600">
                  {merchant.phone ?? "-"}
                </td>

                <td className="max-w-xs p-4 text-sm text-gray-600">
                  {merchant.address}
                </td>

                <td className="p-4">
                  <MerchantStatusBadge status={merchant.verification_status} />
                </td>

                <td className="p-4 text-right">
                  <Link
                    href={`/admin/merchants/${merchant.id}`}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Lihat Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {merchants?.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Tidak ada merchant dengan status ini.
          </div>
        )}
      </div>
    </main>
  );
}
