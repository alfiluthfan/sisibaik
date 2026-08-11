import Link from "next/link";

import { ProductForm } from "@/features/products/components/product-form";
import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  await requireApprovedMerchant();

  const supabase =
    await createClient();

  const {
    data: categories,
    error,
  } = await supabase
    .from("categories")
    .select(`
      id,
      name
    `)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(
      `Gagal mengambil kategori: ${error.message}`
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/merchant/products"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Kembali ke Produk
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Tambah Produk
          </h1>

          <p className="mt-2 text-gray-600">
            Tambahkan makanan surplus yang
            tersedia untuk pelanggan SisiBaik.
          </p>
        </div>

        {/* Form */}
        <section className="rounded-2xl border bg-white p-6">
          <ProductForm
            categories={
              categories ?? []
            }
          />
        </section>
      </div>
    </main>
  );
}