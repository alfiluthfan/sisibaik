import Link from "next/link";

import { notFound } from "next/navigation";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { StockAdjustmentForm } from "@/features/inventory/components/stock-adjustment-form";

interface InventoryDetailProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function InventoryDetailPage({
  params,
}: InventoryDetailProps) {
  const { merchant } = await requireApprovedMerchant();

  const { productId } = await params;

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        available_stock,
        status
      `,
    )
    .eq("id", productId)
    .eq("merchant_id", merchant.id)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  const { data: logs, error: logsError } = await supabase
    .from("inventory_logs")
    .select(
      `
        id,
        previous_stock,
        current_stock,
        quantity_change,
        activity_type,
        notes,
        created_at
      `,
    )
    .eq("product_id", product.id)
    .order("created_at", {
      ascending: false,
    });

  if (logsError) {
    throw new Error(logsError.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/merchant/inventory" className="text-sm text-gray-500">
          ← Kembali ke Inventory
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <p className="mt-2 text-gray-600">
            Stok saat ini: <strong>{product.available_stock}</strong>
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* STOCK FORM */}

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold">Update Stok</h2>

            <div className="mt-5">
              <StockAdjustmentForm productId={product.id} />
            </div>
          </section>

          {/* LOGS */}

          <section>
            <h2 className="text-lg font-semibold">Riwayat Stok</h2>

            <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left">Aktivitas</th>

                    <th className="p-4 text-center">Sebelum</th>

                    <th className="p-4 text-center">Perubahan</th>

                    <th className="p-4 text-center">Sesudah</th>

                    <th className="p-4 text-left">Catatan</th>

                    <th className="p-4 text-left">Waktu</th>
                  </tr>
                </thead>

                <tbody>
                  {logs?.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-4 text-sm">{log.activity_type}</td>

                      <td className="p-4 text-center">{log.previous_stock}</td>

                      <td className="p-4 text-center font-medium">
                        {log.quantity_change > 0 ? "+" : ""}

                        {log.quantity_change}
                      </td>

                      <td className="p-4 text-center">{log.current_stock}</td>

                      <td className="p-4 text-sm text-gray-500">
                        {log.notes ?? "-"}
                      </td>

                      <td className="p-4 text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs?.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                  Belum ada riwayat stok.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
