"use client";

import { useActionState } from "react";

import { adjustStockAction, type InventoryActionState } from "../actions";

interface StockAdjustmentFormProps {
  productId: string;
}

const initialState: InventoryActionState = {};

export function StockAdjustmentForm({ productId }: StockAdjustmentFormProps) {
  const [state, formAction, pending] = useActionState(
    adjustStockAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />

      <div>
        <label className="text-sm font-medium">Jenis Aktivitas</label>

        <select
          name="activityType"
          defaultValue="restock"
          className="mt-2 w-full rounded-lg border px-4 py-3"
        >
          <option value="restock">Tambah Stok</option>

          <option value="manual_reduction">Kurangi Stok</option>

          <option value="adjustment">Penyesuaian</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Perubahan Stok</label>

        <input
          type="number"
          name="quantityChange"
          required
          placeholder="Contoh: 10 atau -3"
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          Tambah stok menggunakan angka positif. Pengurangan menggunakan angka
          negatif.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Catatan</label>

        <textarea
          name="notes"
          rows={3}
          placeholder="Contoh: Restock produksi pagi"
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Simpan Perubahan Stok"}
      </button>
    </form>
  );
}
