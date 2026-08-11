import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { requireMerchant } from "@/lib/merchant/get-merchant";

export default async function InventoryPage() {
  const { merchant } = await requireMerchant();

  const supabase = await createClient();

  const { data: products } = await supabase
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

  return (
    <main className="p-8">
      <div>
        <p className="text-sm text-gray-500">Inventory</p>

        <h1 className="text-3xl font-bold">Stok Produk</h1>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <article key={product.id} className="rounded-xl border p-5">
            <h2 className="font-semibold">{product.name}</h2>

            <div className="mt-4">
              <span className="text-3xl font-bold">
                {product.available_stock}
              </span>

              <span className="ml-2 text-sm text-gray-500">stok</span>
            </div>

            <p className="mt-2 text-sm text-gray-500">{product.status}</p>

            <Link
              href={`/merchant/inventory/${product.id}`}
              className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm"
            >
              Kelola Stok
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
