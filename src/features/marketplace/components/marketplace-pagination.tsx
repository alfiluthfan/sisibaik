import Link from "next/link";

interface Props {
  currentPage: number;

  totalPages: number;

  search: string;

  category: string;

  sort: string;
}

export function MarketplacePagination({
  currentPage,
  totalPages,
  search,
  category,
  sort,
}: Props) {
  if (totalPages <= 1) {
    return null;
  }

  function createHref(page: number) {
    const params = new URLSearchParams();

    if (search) {
      params.set("q", search);
    }

    if (category) {
      params.set("category", category);
    }

    if (sort) {
      params.set("sort", sort);
    }

    params.set("page", String(page));

    return `/marketplace?${params.toString()}`;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-4">
      {currentPage > 1 ? (
        <Link
          href={createHref(currentPage - 1)}
          className="rounded-xl border bg-white px-4 py-2 text-sm"
        >
          ← Sebelumnya
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-gray-500">
        Halaman {currentPage} dari {totalPages}
      </span>

      {currentPage < totalPages && (
        <Link
          href={createHref(currentPage + 1)}
          className="rounded-xl border bg-white px-4 py-2 text-sm"
        >
          Berikutnya →
        </Link>
      )}
    </nav>
  );
}
