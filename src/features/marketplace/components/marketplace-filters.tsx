interface Category {
  id: string;

  name: string;

  slug: string;
}

interface Props {
  categories: Category[];

  search: string;

  category: string;

  sort: string;
}

export function MarketplaceFilters({
  categories,
  search,
  category,
  sort,
}: Props) {
  return (
    <form
      method="GET"
      action="/marketplace"
      className="grid gap-3 rounded-2xl border bg-white p-4 lg:grid-cols-[1fr_220px_220px_auto]"
    >
      {/* SEARCH */}

      <input
        type="search"
        name="q"
        defaultValue={search}
        placeholder="Cari makanan surplus..."
        className="rounded-xl border px-4 py-3 outline-none focus:ring-2"
      />

      {/* CATEGORY */}

      <select
        name="category"
        defaultValue={category}
        className="rounded-xl border px-4 py-3"
      >
        <option value="">Semua Kategori</option>

        {categories.map((item) => (
          <option key={item.id} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>

      {/* SORT */}

      <select
        name="sort"
        defaultValue={sort}
        className="rounded-xl border px-4 py-3"
      >
        <option value="deadline">Segera Berakhir</option>

        <option value="newest">Terbaru</option>

        <option value="price_low">Harga Terendah</option>

        <option value="price_high">Harga Tertinggi</option>

        {/* <option value="discount">Diskon Terbesar</option> */}
      </select>

      <button
        type="submit"
        className="rounded-xl bg-black px-6 py-3 font-medium text-white"
      >
        Cari
      </button>
    </form>
  );
}
