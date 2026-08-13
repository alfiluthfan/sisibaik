import Link from "next/link";

import { notFound } from "next/navigation";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { PRODUCT_IMAGE_BUCKET } from "@/lib/storage/product-images";

import { ProductImageUploader } from "@/features/products/components/product-image-uploader";

import { EditProductForm } from "@/features/products/components/edit-product-form";

import { archiveProductAction } from "@/features/products/actions";

interface EditProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { profile, merchant } = await requireApprovedMerchant();

  const { productId } = await params;

  const supabase = await createClient();

  // ===========================
  // PRODUCT
  // ===========================

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
        id,
        merchant_id,
        category_id,
        name,
        description,
        normal_price,
        surplus_price,
        available_stock,
        pickup_deadline,
        status,
        image_path,
        created_at,
        updated_at
      `,
    )
    .eq("id", productId)
    .eq("merchant_id", merchant.id)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  // ===========================
  // CATEGORIES
  // ===========================

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select(
      `
        id,
        name
      `,
    )
    .eq("is_active", true)
    .order("name");

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  // ===========================
  // PUBLIC IMAGE URL
  // ===========================

  let imageUrl: string | null = null;

  if (product.image_path) {
    const { data } = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(product.image_path);

    imageUrl = data.publicUrl;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* BACK */}

        <Link
          href="/merchant/products"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Kembali ke Produk
        </Link>

        {/* HEADER */}

        <div className="mt-5">
          <p className="text-sm text-gray-500">Edit Produk</p>

          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
        </div>

        {/* CONTENT */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* LEFT */}

          <aside className="space-y-6">
            {/* IMAGE */}

            <section className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold">Foto Produk</h2>

              <p className="mt-1 text-sm text-gray-500">
                Foto ini akan ditampilkan di marketplace.
              </p>

              <div className="mt-5">
                <ProductImageUploader
                  productId={product.id}
                  ownerUserId={profile.id}
                  currentImageUrl={imageUrl}
                />
              </div>
            </section>

            {/* INVENTORY */}

            <section className="rounded-2xl border bg-white p-6">
              <p className="text-sm text-gray-500">Stok tersedia</p>

              <p className="mt-1 text-4xl font-bold">
                {product.available_stock}
              </p>

              <Link
                href={`/merchant/inventory/${product.id}`}
                className="mt-5 block rounded-lg border px-4 py-3 text-center text-sm font-medium"
              >
                Kelola Inventory
              </Link>
            </section>
          </aside>

          {/* EDIT FORM */}

          <section className="rounded-2xl border bg-white p-7">
            <h2 className="text-lg font-semibold">Informasi Produk</h2>

            <p className="mt-1 text-sm text-gray-500">
              Perbarui informasi yang ditampilkan kepada pengguna.
            </p>

            <div className="mt-7">
              <EditProductForm
                product={{
                  id: product.id,

                  name: product.name,

                  description: product.description,

                  category_id: product.category_id,

                  normal_price: Number(product.normal_price),

                  surplus_price: Number(product.surplus_price),

                  available_stock: product.available_stock,

                  pickup_deadline: product.pickup_deadline,

                  status: product.status,
                }}
                categories={categories ?? []}
              />
            </div>
          </section>
        </div>

        {/* DANGER ZONE */}

        {product.status !== "archived" && (
          <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-600">Arsipkan Produk</h2>

            <p className="mt-2 text-sm text-gray-500">
              Produk yang diarsipkan tidak akan ditampilkan pada marketplace.
            </p>

            <form
              action={archiveProductAction.bind(null, product.id)}
              className="mt-5"
            >
              <button
                type="submit"
                className="rounded-lg border border-red-200 px-5 py-3 text-sm font-medium text-red-600"
              >
                Arsipkan Produk
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
