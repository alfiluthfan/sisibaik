import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { getProductImageUrl } from "@/lib/format/product-image";

import { MarketplaceFilters } from "@/features/marketplace/components/marketplace-filters";

import { MarketplaceProductCard } from "@/features/marketplace/components/marketplace-product-card";

import { MarketplaceEmpty } from "@/features/marketplace/components/marketplace-empty";

import { MarketplacePagination } from "@/features/marketplace/components/marketplace-pagination";

interface MarketplacePageProps {
  searchParams: Promise<{
    q?: string;

    category?: string;

    sort?: string;

    page?: string;
  }>;
}

const PAGE_SIZE = 12;

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  /*
   * Marketplace MVP:
   * customer only.
   */

  await requireRole("customer");

  const params = await searchParams;

  const search = params.q?.trim().slice(0, 100) ?? "";

  const category = params.category ?? "";

  const allowedSorts = [
    "deadline",
    "newest",
    "price_low",
    "price_high",
    "discount",
  ];

  const sort = allowedSorts.includes(params.sort ?? "")
    ? params.sort!
    : "deadline";

  const requestedPage = Number(params.page);

  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const from = (currentPage - 1) * PAGE_SIZE;

  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // =============================
  // CATEGORIES
  // =============================

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select(
      `
        id,
        name,
        slug
      `,
    )
    .eq("is_active", true)
    .order("name");

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  // =============================
  // PRODUCTS QUERY
  // =============================

  let query = supabase
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

          created_at,

          categories!inner (
            id,
            name,
            slug
          ),

          merchant_profiles!inner (
            id,
            business_name,
            address,
            verification_status
          )
        `,
      {
        count: "exact",
      },
    )

    /*
     * Jangan hanya mengandalkan
     * database status.
     */

    .eq("status", "active")

    .gt("available_stock", 0)

    .gt("pickup_deadline", new Date().toISOString())

    .eq("merchant_profiles.verification_status", "approved");

  // =============================
  // SEARCH
  // =============================

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // =============================
  // CATEGORY
  // =============================

  if (category) {
    query = query.eq("categories.slug", category);
  }

  // =============================
  // SORT
  // =============================

  switch (sort) {
    case "newest":
      query = query.order("created_at", {
        ascending: false,
      });

      break;

    case "price_low":
      query = query.order("surplus_price", {
        ascending: true,
      });

      break;

    case "price_high":
      query = query.order("surplus_price", {
        ascending: false,
      });

      break;

    /*
     * Untuk discount kita belum punya
     * kolom discount_percentage.
     *
     * Untuk MVP sementara kita urutkan
     * surplus_price terendah.
     *
     * Nanti bisa dibuat SQL view/RPC
     * untuk diskon sebenarnya.
     */

    case "discount":
      query = query.order("surplus_price", {
        ascending: true,
      });

      break;

    default:
      query = query.order("pickup_deadline", {
        ascending: true,
      });
  }

  // =============================
  // PAGINATION
  // =============================

  query = query.range(from, to);

  const { data: products, error, count } = await query;

  if (error) {
    throw new Error(`Gagal mengambil marketplace: ${error.message}`);
  }

  const marketplaceProducts = (products ?? []).map((product) => ({
    id: product.id,

    name: product.name,

    imageUrl: getProductImageUrl(supabase, product.image_path),

    normalPrice: Number(product.normal_price),

    surplusPrice: Number(product.surplus_price),

    availableStock: product.available_stock,

    pickupDeadline: product.pickup_deadline,

    status: product.status,

    categoryName: product.categories.name,

    merchantName: product.merchant_profiles.business_name,

    merchantAddress: product.merchant_profiles.address,
  }));

  const totalPages = Math.max(
    1,

    Math.ceil((count ?? 0) / PAGE_SIZE),
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {/* HERO */}

        <section>
          <p className="text-sm font-semibold text-green-700">
            SisiBaik Marketplace
          </p>

          <h1 className="mt-2 max-w-3xl text-3xl font-bold md:text-5xl">
            Makanan Enak Tidak Harus Berakhir Menjadi Sampah.
          </h1>

          <p className="mt-4 max-w-2xl text-gray-600">
            Temukan makanan surplus dari UMKM dengan harga lebih terjangkau dan
            bantu mengurangi makanan terbuang.
          </p>
        </section>

        {/* FILTER */}

        <div className="mt-8">
          <MarketplaceFilters
            categories={categories ?? []}
            search={search}
            category={category}
            sort={sort}
          />
        </div>

        {/* RESULT */}

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">Makanan Tersedia</h2>

              <p className="mt-1 text-sm text-gray-500">
                {count ?? 0} produk ditemukan
              </p>
            </div>
          </div>

          {/* GRID */}

          <div className="mt-5">
            {marketplaceProducts.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {marketplaceProducts.map((product) => (
                  <MarketplaceProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <MarketplaceEmpty />
            )}
          </div>

          <MarketplacePagination
            currentPage={currentPage}
            totalPages={totalPages}
            search={search}
            category={category}
            sort={sort}
          />
        </section>
      </div>
    </main>
  );
}
