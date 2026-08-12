import Link from "next/link";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { archiveProductAction } from "@/features/products/actions";

export default async function ProductsPage() {
  const { merchant } = await requireApprovedMerchant();

  const supabase = await createClient();

  const { data: products, error } = await supabase
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

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Merchant</p>

          <h1 className="text-3xl font-bold">Produk</h1>
        </div>

        <Link
          href="/merchant/products/new"
          className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
        >
          + Tambah Produk
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Produk</th>

              <th className="p-4 text-left">Harga</th>

              <th className="p-4 text-center">Stok</th>

              <th className="p-4 text-left">Status</th>

              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-4">
                  <p className="font-medium">{product.name}</p>

                  <p className="text-sm text-gray-500">
                    {product.categories?.name}
                  </p>
                </td>

                <td className="p-4">
                  <p className="text-xs text-gray-400 line-through">
                    Rp
                    {Number(product.normal_price).toLocaleString("id-ID")}
                  </p>

                  <p className="font-medium">
                    Rp
                    {Number(product.surplus_price).toLocaleString("id-ID")}
                  </p>
                </td>

                <td className="p-4 text-center font-semibold">
                  {product.available_stock}
                </td>

                <td className="p-4 capitalize">{product.status}</td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/merchant/products/${product.id}/edit`}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Edit
                    </Link>

                    <Link
                      href={`/merchant/inventory/${product.id}`}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Stok
                    </Link>

                    {product.status !== "archived" && (
                      <form
                        action={archiveProductAction.bind(null, product.id)}
                      >
                        <button className="rounded-lg border px-3 py-2 text-sm text-red-600">
                          Arsipkan
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products?.length === 0 && (
          <div className="p-12 text-center">
            <p className="font-medium">Belum ada produk</p>

            <p className="mt-1 text-sm text-gray-500">
              Tambahkan produk surplus pertama Anda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
