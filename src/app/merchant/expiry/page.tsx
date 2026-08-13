import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import {
  getProductSellingState,
  getTimeRemaining,
} from "@/features/products/utils/selling-state";

import { SellingStatusBadge } from "@/features/products/components/selling-status-badge";

export default async function ExpiryTrackerPage() {
  const { merchant } = await requireApprovedMerchant();

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        available_stock,
        pickup_deadline,
        status
      `,
    )
    .eq("merchant_id", merchant.id)
    .neq("status", "archived")
    .order("pickup_deadline", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const now = new Date();

  const trackedProducts = (products ?? []).map((product) => ({
    ...product,

    sellingState: getProductSellingState(product, now),
  }));

  const activeCount = trackedProducts.filter(
    (product) => product.sellingState === "active",
  ).length;

  const expiringSoonCount = trackedProducts.filter(
    (product) => product.sellingState === "expiring_soon",
  ).length;

  const expiredCount = trackedProducts.filter(
    (product) => product.sellingState === "expired",
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div>
          <p className="text-sm text-gray-500">Merchant</p>

          <h1 className="text-3xl font-bold">Selling-Time Tracker</h1>

          <p className="mt-2 text-gray-600">
            Pantau batas waktu penjualan makanan surplus Anda.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-gray-500">Aktif</p>

            <p className="mt-2 text-4xl font-bold">{activeCount}</p>
          </article>

          <article className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-gray-500">Segera Berakhir</p>

            <p className="mt-2 text-4xl font-bold">{expiringSoonCount}</p>
          </article>

          <article className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-gray-500">Expired</p>

            <p className="mt-2 text-4xl font-bold">{expiredCount}</p>
          </article>
        </div>

        {/* TABLE */}

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Produk</h2>

          <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Produk</th>

                  <th className="p-4 text-center">Stok</th>

                  <th className="p-4 text-left">Status</th>

                  <th className="p-4 text-left">Deadline</th>

                  <th className="p-4 text-left">Sisa Waktu</th>
                </tr>
              </thead>

              <tbody>
                {trackedProducts.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4 font-medium">{product.name}</td>

                    <td className="p-4 text-center">
                      {product.available_stock}
                    </td>

                    <td className="p-4">
                      <SellingStatusBadge state={product.sellingState} />
                    </td>

                    <td className="p-4 text-sm">
                      {new Date(product.pickup_deadline).toLocaleString(
                        "id-ID",
                      )}
                    </td>

                    <td className="p-4 text-sm">
                      {getTimeRemaining(product.pickup_deadline, now)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
