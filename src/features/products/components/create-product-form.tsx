"use client";

import { useActionState } from "react";

import { createProductAction, type ProductActionState } from "../actions";

interface Category {
  id: string;
  name: string;
}

interface CreateProductFormProps {
  categories: Category[];
}

const initialState: ProductActionState = {};

export function CreateProductForm({ categories }: CreateProductFormProps) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="text-sm font-medium">Nama Produk</label>

        <input
          name="name"
          required
          className="mt-2 w-full rounded-lg border px-4 py-3"
          placeholder="Contoh: Roti Cokelat"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Kategori</label>

        <select
          name="categoryId"
          required
          defaultValue=""
          className="mt-2 w-full rounded-lg border px-4 py-3"
        >
          <option value="" disabled>
            Pilih kategori
          </option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Deskripsi</label>

        <textarea
          name="description"
          rows={4}
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Harga Normal</label>

          <input
            type="number"
            name="normalPrice"
            min="1"
            required
            className="mt-2 w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Harga Surplus</label>

          <input
            type="number"
            name="surplusPrice"
            min="0"
            required
            className="mt-2 w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Stok Awal</label>

        <input
          type="number"
          name="availableStock"
          min="0"
          defaultValue="0"
          required
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          Setelah produk dibuat, stok dikelola melalui menu Inventory.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Batas Pengambilan</label>

        <input
          type="datetime-local"
          name="pickupDeadline"
          required
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Status</label>

        <select
          name="status"
          defaultValue="draft"
          className="mt-2 w-full rounded-lg border px-4 py-3"
        >
          <option value="draft">Draft</option>

          <option value="active">Aktif</option>
        </select>
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Produk"}
      </button>
    </form>
  );
}
