import { adjustStockAction } from "@/features/inventory/actions";

interface StockFormProps {
  productId: string;
}

export function StockForm({ productId }: StockFormProps) {
  return (
    <form action={adjustStockAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />

      <div>
        <label className="text-sm font-medium">Aktivitas</label>

        <select
          name="activityType"
          className="mt-2 w-full rounded-lg border p-3"
          defaultValue="restock"
        >
          <option value="restock">Tambah stok</option>

          <option value="manual_reduction">Kurangi stok</option>

          <option value="adjustment">Penyesuaian</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Perubahan Stok</label>

        <input
          type="number"
          name="quantityChange"
          required
          placeholder="+10 atau -3"
          className="mt-2 w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Catatan</label>

        <textarea
          name="notes"
          placeholder="Contoh: tambahan stok produksi pagi"
          className="mt-2 w-full rounded-lg border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-black px-4 py-3 text-white"
      >
        Simpan Perubahan
      </button>
    </form>
  );
}
