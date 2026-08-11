interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
}

export function ProductForm({
  categories,
}: ProductFormProps) {
  return (
    <form
      action={async (formData) => {
        "use server";

        const {
          createProductAction,
        } = await import(
          "@/features/products/actions"
        );

        await createProductAction(formData);
      }}
      className="space-y-6"
    >
      {/* Nama Produk */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium"
        >
          Nama Produk
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Contoh: Roti Cokelat"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      {/* Kategori */}
      <div className="space-y-2">
        <label
          htmlFor="categoryId"
          className="text-sm font-medium"
        >
          Kategori
        </label>

        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue=""
          className="w-full rounded-lg border px-4 py-3"
        >
          <option
            value=""
            disabled
          >
            Pilih kategori
          </option>

          {categories.map(
            (category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            )
          )}
        </select>
      </div>

      {/* Deskripsi */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium"
        >
          Deskripsi
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Deskripsi produk"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      {/* Harga */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="normalPrice"
            className="text-sm font-medium"
          >
            Harga Normal
          </label>

          <input
            id="normalPrice"
            name="normalPrice"
            type="number"
            min="1"
            required
            placeholder="20000"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="surplusPrice"
            className="text-sm font-medium"
          >
            Harga Surplus
          </label>

          <input
            id="surplusPrice"
            name="surplusPrice"
            type="number"
            min="0"
            required
            placeholder="10000"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>

      {/* Stock */}
      <div className="space-y-2">
        <label
          htmlFor="availableStock"
          className="text-sm font-medium"
        >
          Stok Awal
        </label>

        <input
          id="availableStock"
          name="availableStock"
          type="number"
          min="0"
          required
          defaultValue="0"
          className="w-full rounded-lg border px-4 py-3"
        />

        <p className="text-xs text-gray-500">
          Stok selanjutnya akan dikelola
          melalui menu Inventory.
        </p>
      </div>

      {/* Pickup Deadline */}
      <div className="space-y-2">
        <label
          htmlFor="pickupDeadline"
          className="text-sm font-medium"
        >
          Batas Waktu Pengambilan
        </label>

        <input
          id="pickupDeadline"
          name="pickupDeadline"
          type="datetime-local"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label
          htmlFor="status"
          className="text-sm font-medium"
        >
          Status Produk
        </label>

        <select
          id="status"
          name="status"
          defaultValue="draft"
          className="w-full rounded-lg border px-4 py-3"
        >
          <option value="draft">
            Draft
          </option>

          <option value="active">
            Aktif
          </option>
        </select>
      </div>

      <div className="flex gap-3">
        <a
          href="/merchant/products"
          className="rounded-lg border px-5 py-3 font-medium"
        >
          Batal
        </a>

        <button
          type="submit"
          className="rounded-lg bg-black px-5 py-3 font-medium text-white"
        >
          Simpan Produk
        </button>
      </div>
    </form>
  );
}