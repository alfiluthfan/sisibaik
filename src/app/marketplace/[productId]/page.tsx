import Image from "next/image";
import Link from "next/link";

import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { formatRupiah } from "@/lib/format/currency";

import { getProductImageUrl } from "@/lib/format/product-image";

import { getProductSellingState } from "@/features/products/utils/selling-state";

import { SellingCountdown } from "@/features/marketplace/components/selling-countdown";

import { ReservationForm } from "@/features/orders/components/reservation-form";

interface ProductDetailProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailProps) {
  await requireRole("customer");

  const { productId } = await params;

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        description,
        image_path,

        normal_price,
        surplus_price,

        available_stock,

        pickup_deadline,
        status,

        categories!inner (
          id,
          name,
          slug
        ),

        merchant_profiles!inner (
          id,
          business_name,
          address,
          latitude,
          longitude,
          verification_status
        )
      `,
    )

    .eq("id", productId)

    .eq("status", "active")

    .gt("available_stock", 0)

    .gt("pickup_deadline", new Date().toISOString())

    .eq("merchant_profiles.verification_status", "approved")

    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  const normalPrice = Number(product.normal_price);

  const surplusPrice = Number(product.surplus_price);

  const discount = Math.round(
    ((normalPrice - surplusPrice) / normalPrice) * 100,
  );

  const imageUrl = getProductImageUrl(supabase, product.image_path);

  const sellingState = getProductSellingState(product);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <Link
          href="/marketplace"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Kembali ke Marketplace
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {/* IMAGE */}

          <section>
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-gray-100">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-8xl">🍱</span>
                </div>
              )}
            </div>
          </section>

          {/* PRODUCT */}

          <section className="rounded-3xl border bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-500">
                {product.categories.name}
              </span>

              {sellingState === "expiring_soon" && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  🔥 Segera Berakhir
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>

            <p className="mt-2 text-gray-500">
              {product.merchant_profiles.business_name}
            </p>

            {/* PRICE */}

            <div className="mt-7">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 line-through">
                  {formatRupiah(normalPrice)}
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                  Hemat {discount}%
                </span>
              </div>

              <p className="mt-2 text-4xl font-bold">
                {formatRupiah(surplusPrice)}
              </p>
            </div>

            {/* TIME */}

            <div className="mt-7 rounded-2xl bg-orange-50 p-5">
              <p className="text-sm text-orange-700">
                Waktu pengambilan tersisa
              </p>

              <p className="mt-1 text-xl font-bold text-orange-800">
                <SellingCountdown deadline={product.pickup_deadline} />
              </p>

              <p className="mt-2 text-xs text-orange-700">
                Batas pengambilan:{" "}
                {new Date(product.pickup_deadline).toLocaleString("id-ID")}
              </p>
            </div>

            {/* STOCK */}

            <div className="mt-5 flex items-center justify-between rounded-xl border p-4">
              <span className="text-gray-500">Stok tersedia</span>

              <strong>{product.available_stock}</strong>
            </div>

            {/* DESCRIPTION */}

            <div className="mt-7 border-t pt-6">
              <h2 className="font-semibold">Tentang Produk</h2>

              <p className="mt-2 whitespace-pre-line leading-relaxed text-gray-600">
                {product.description ?? "Tidak ada deskripsi produk."}
              </p>
            </div>

            {/* MERCHANT */}

            <div className="mt-7 border-t pt-6">
              <h2 className="font-semibold">Lokasi Pengambilan</h2>

              <p className="mt-3 font-medium">
                {product.merchant_profiles.business_name}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {product.merchant_profiles.address ?? "Alamat belum tersedia"}
              </p>
            </div>

            {/* RESERVATION */}

            <div className="mt-8 border-t pt-6">
              <h2 className="font-semibold">Reservasi</h2>

              <p className="mt-1 text-sm text-gray-500">
                Pilih jumlah makanan yang ingin Anda ambil.
              </p>

              <div className="mt-5">
                <ReservationForm
                  productId={product.id}
                  availableStock={product.available_stock}
                  price={Number(product.surplus_price)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
