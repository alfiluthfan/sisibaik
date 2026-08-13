import Image from "next/image";
import Link from "next/link";

import { formatRupiah } from "@/lib/format/currency";

import { getProductSellingState } from "@/features/products/utils/selling-state";

import { SellingCountdown } from "./selling-countdown";

interface MarketplaceProduct {
  id: string;

  name: string;

  imageUrl: string | null;

  normalPrice: number;

  surplusPrice: number;

  availableStock: number;

  pickupDeadline: string;

  status: "draft" | "active" | "sold_out" | "expired" | "archived";

  categoryName: string;

  merchantName: string;

  merchantAddress: string | null;
}

interface Props {
  product: MarketplaceProduct;
}

export function MarketplaceProductCard({ product }: Props) {
  const discount =
    product.normalPrice > 0
      ? Math.round(
          ((product.normalPrice - product.surplusPrice) / product.normalPrice) *
            100,
        )
      : 0;

  const sellingState = getProductSellingState({
    status: product.status,

    available_stock: product.availableStock,

    pickup_deadline: product.pickupDeadline,
  });

  return (
    <article className="group overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-md">
      {/* IMAGE */}

      <Link
        href={`/marketplace/${product.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gray-100"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="text-5xl">🍱</span>

              <p className="mt-2 text-xs text-gray-400">Foto belum tersedia</p>
            </div>
          </div>
        )}

        {/* DISCOUNT */}

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">
            Hemat {discount}%
          </span>
        )}

        {/* EXPIRING */}

        {sellingState === "expiring_soon" && (
          <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            Segera Berakhir
          </span>
        )}
      </Link>

      {/* CONTENT */}

      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {product.categoryName}
        </p>

        <Link href={`/marketplace/${product.id}`}>
          <h2 className="mt-2 line-clamp-2 text-lg font-semibold hover:underline">
            {product.name}
          </h2>
        </Link>

        <p className="mt-1 text-sm text-gray-500">{product.merchantName}</p>

        {/* PRICE */}

        <div className="mt-4">
          <p className="text-sm text-gray-400 line-through">
            {formatRupiah(product.normalPrice)}
          </p>

          <p className="text-xl font-bold">
            {formatRupiah(product.surplusPrice)}
          </p>
        </div>

        {/* STOCK */}

        <div className="mt-5 flex justify-between text-sm">
          <span className="text-gray-500">Stok tersisa</span>

          <span className="font-semibold">{product.availableStock}</span>
        </div>

        {/* TIME */}

        <div className="mt-2 flex justify-between gap-3 text-sm">
          <span className="text-gray-500">Waktu tersisa</span>

          <span
            className={
              sellingState === "expiring_soon"
                ? "font-semibold text-orange-600"
                : "font-medium"
            }
          >
            <SellingCountdown deadline={product.pickupDeadline} />
          </span>
        </div>

        <Link
          href={`/marketplace/${product.id}`}
          className="mt-5 block rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Lihat Detail
        </Link>
      </div>
    </article>
  );
}
