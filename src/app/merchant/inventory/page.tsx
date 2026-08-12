import Link from "next/link";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const { merchant } = await requireApprovedMerchant();

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        available_stock,
        status,
        pickup_deadline
      `,
    )
    .eq("merchant_id", merchant.id)
    .neq("status", "archived")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="p-8">
      <div>
        <p className="text-sm text-gray-500">Merchant</p>

        <h1 className="text-3xl font-bold">Inventory</h1>

        <p className="mt-2 text-gray-600">Kelola stok makanan surplus Anda.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <article key={product.id} className="rounded-2xl border bg-white p-6">
            <div className="flex justify-between">
              <h2 className="font-semibold">{product.name}</h2>

              <span className="text-xs capitalize text-gray-500">
                {product.status}
              </span>
            </div>

            <div className="mt-5">
              <span className="text-4xl font-bold">
                {product.available_stock}
              </span>

              <span className="ml-2 text-sm text-gray-500">stok tersedia</span>
            </div>

            <Link
              href={`/merchant/inventory/${product.id}`}
              className="mt-6 block rounded-lg border px-4 py-3 text-center text-sm font-medium"
            >
              Kelola Stok
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
