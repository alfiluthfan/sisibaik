import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { archiveProductAction } from "@/features/products/actions";

export default async function ProductsPage() {
  const { merchant } = await requireApprovedMerchant();

  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      normal_price,
      surplus_price,
      available_stock,
      pickup_deadline,
      status,
      categories (
        name
      )
    `,
    )
    .eq("merchant_id", merchant.id)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Mitra UMKM</p>

          <h1 className="text-3xl font-bold">Produk</h1>
        </div>

        <Link
          href="/merchant/products/new"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Tambah Produk
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Produk</th>

              <th className="p-4 text-left">Harga</th>

              <th className="p-4 text-left">Stok</th>

              <th className="p-4 text-left">Status</th>

              <th className="p-4">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-4">{product.name}</td>

                <td className="p-4">
                  <div className="text-sm line-through text-gray-400">
                    Rp
                    {Number(product.normal_price).toLocaleString("id-ID")}
                  </div>

                  <div>
                    Rp
                    {Number(product.surplus_price).toLocaleString("id-ID")}
                  </div>
                </td>

                <td className="p-4">{product.available_stock}</td>

                <td className="p-4">{product.status}</td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/merchant/products/${product.id}/edit`}
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/merchant/inventory/${product.id}`}
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Stok
                    </Link>

                    <form action={archiveProductAction.bind(null, product.id)}>
                      <button
                        type="submit"
                        className="rounded border px-3 py-2 text-sm"
                      >
                        Arsipkan
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
