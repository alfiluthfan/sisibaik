import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { requireMerchant } from "@/lib/merchant/get-merchant";

import { StockForm } from "@/features/inventory/components/stock-form";

interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function InventoryDetailPage({ params }: PageProps) {
  await requireMerchant();

  const { productId } = await params;

  const supabase = await createClient();

  const { data: product } = await supabase
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
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const { data: logs } = await supabase
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
    .eq("product_id", productId)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="p-8">
      <div>
        <p className="text-sm text-gray-500">Inventory</p>

        <h1 className="text-3xl font-bold">{product.name}</h1>

        <p className="mt-2 text-gray-600">
          Stok saat ini: <strong>{product.available_stock}</strong>
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Update Stok</h2>

          <div className="mt-6">
            <StockForm productId={product.id} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Riwayat Stok</h2>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Aktivitas</th>

                  <th className="p-3">Sebelum</th>

                  <th className="p-3">Perubahan</th>

                  <th className="p-3">Sesudah</th>

                  <th className="p-3">Waktu</th>
                </tr>
              </thead>

              <tbody>
                {logs?.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="p-3">{log.activity_type}</td>

                    <td className="p-3 text-center">{log.previous_stock}</td>

                    <td className="p-3 text-center">
                      {log.quantity_change > 0 ? "+" : ""}

                      {log.quantity_change}
                    </td>

                    <td className="p-3 text-center">{log.current_stock}</td>

                    <td className="p-3 text-sm">
                      {new Date(log.created_at).toLocaleString("id-ID")}
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
