import Link from "next/link";

export function MarketplaceEmpty() {
  return (
    <div className="rounded-2xl border bg-white px-6 py-16 text-center">
      <div className="text-6xl">🍽️</div>

      <h2 className="mt-5 text-xl font-semibold">
        Tidak ada makanan ditemukan
      </h2>

      <p className="mt-2 text-gray-500">
        Coba ubah kata pencarian atau kategori yang digunakan.
      </p>

      <Link
        href="/marketplace"
        className="mt-6 inline-block rounded-xl border px-5 py-3 text-sm font-medium"
      >
        Reset Filter
      </Link>
    </div>
  );
}
