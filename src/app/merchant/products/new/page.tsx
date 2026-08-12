import Link from "next/link";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { CreateProductForm } from "@/features/products/components/create-product-form";

export default async function NewProductPage() {
  await requireApprovedMerchant();

  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select(
      `
        id,
        name
      `,
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/merchant/products" className="text-sm text-gray-500">
          ← Kembali
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Tambah Produk</h1>

        <p className="mt-2 text-gray-600">
          Tambahkan makanan surplus yang tersedia di usaha Anda.
        </p>

        <section className="mt-8 rounded-2xl border bg-white p-7">
          <CreateProductForm categories={categories ?? []} />
        </section>
      </div>
    </main>
  );
}
