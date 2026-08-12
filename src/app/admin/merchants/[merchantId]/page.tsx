import Link from "next/link";

import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/require-admin";

import { createClient } from "@/lib/supabase/server";

import { MerchantStatusBadge } from "@/features/admin/merchant-verification/components/merchant-status-badge";

import { MerchantReviewForm } from "@/features/admin/merchant-verification/components/merchant-review-form";

interface MerchantDetailPageProps {
  params: Promise<{
    merchantId: string;
  }>;
}

export default async function MerchantDetailPage({
  params,
}: MerchantDetailPageProps) {
  await requireAdmin();

  const { merchantId } = await params;

  const supabase = await createClient();

  // ==============================
  // MERCHANT
  // ==============================

  const { data: merchant, error } = await supabase
    .from("merchant_profiles")
    .select(
      `
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
        reviewed_at,
        reviewed_by
      `,
    )
    .eq("id", merchantId)
    .maybeSingle();

  if (error || !merchant) {
    notFound();
  }

  // ==============================
  // OWNER PROFILE
  // ==============================

  const { data: owner } = await supabase
    .from("profiles")
    .select(
      `
        id,
        name,
        role,
        status,
        created_at
      `,
    )
    .eq("id", merchant.user_id)
    .maybeSingle();

  // ==============================
  // REVIEWER
  // ==============================

  let reviewer: {
    name: string;
  } | null = null;

  if (merchant.reviewed_by) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", merchant.reviewed_by)
      .maybeSingle();

    reviewer = data;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/merchants" className="text-sm text-gray-500">
          ← Kembali ke Merchant
        </Link>

        <div className="mt-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Merchant Verification</p>

            <h1 className="mt-1 text-3xl font-bold">
              {merchant.business_name}
            </h1>
          </div>

          <MerchantStatusBadge status={merchant.verification_status} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* INFORMATION */}

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold">Informasi UMKM</h2>

            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm text-gray-500">Pemilik Akun</dt>

                <dd className="mt-1 font-medium">{owner?.name ?? "-"}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Nama Usaha</dt>

                <dd className="mt-1 font-medium">{merchant.business_name}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Nomor Telepon</dt>

                <dd className="mt-1">{merchant.phone ?? "-"}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Deskripsi</dt>

                <dd className="mt-1 whitespace-pre-line text-gray-700">
                  {merchant.description ?? "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Alamat</dt>

                <dd className="mt-1 text-gray-700">{merchant.address}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Koordinat</dt>

                <dd className="mt-1">
                  {merchant.latitude && merchant.longitude
                    ? `${merchant.latitude}, ${merchant.longitude}`
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Tanggal Pengajuan</dt>

                <dd className="mt-1">
                  {new Date(merchant.created_at).toLocaleString("id-ID")}
                </dd>
              </div>
            </dl>
          </section>

          {/* REVIEW */}

          <aside className="space-y-6">
            {merchant.verification_status === "pending" ? (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-lg font-semibold">Keputusan Verifikasi</h2>

                <p className="mt-2 text-sm text-gray-500">
                  Periksa data merchant sebelum mengambil keputusan.
                </p>

                <div className="mt-6">
                  <MerchantReviewForm merchantId={merchant.id} />
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-semibold">Hasil Verifikasi</h2>

                <div className="mt-4">
                  <MerchantStatusBadge status={merchant.verification_status} />
                </div>

                {merchant.rejection_reason && (
                  <div className="mt-5">
                    <p className="text-sm text-gray-500">Alasan Penolakan</p>

                    <p className="mt-1 text-sm">{merchant.rejection_reason}</p>
                  </div>
                )}

                {reviewer && (
                  <div className="mt-5">
                    <p className="text-sm text-gray-500">Ditinjau oleh</p>

                    <p className="font-medium">{reviewer.name}</p>
                  </div>
                )}

                {merchant.reviewed_at && (
                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(merchant.reviewed_at).toLocaleString("id-ID")}
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
