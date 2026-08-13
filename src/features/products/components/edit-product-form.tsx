"use client";

import { useActionState, useEffect, useState } from "react";

import {
  updateProductAction,
  type ProductActionState,
} from "@/features/products/actions";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;

  name: string;

  description: string | null;

  category_id: string;

  normal_price: number;

  surplus_price: number;

  available_stock: number;

  pickup_deadline: string;

  status: "draft" | "active" | "sold_out" | "expired" | "archived";
}

interface EditProductFormProps {
  product: Product;

  categories: Category[];
}

const initialState: ProductActionState = {};

function isoToLocalInput(iso: string) {
  const date = new Date(iso);

  /*
   * Convert ISO UTC
   * menjadi datetime-local browser.
   */

  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export function EditProductForm({ product, categories }: EditProductFormProps) {
  const updateAction = updateProductAction.bind(null, product.id);

  const [state, formAction, pending] = useActionState(
    updateAction,
    initialState,
  );

  const [deadlineLocal, setDeadlineLocal] = useState("");

  useEffect(() => {
    setDeadlineLocal(isoToLocalInput(product.pickup_deadline));
  }, [product.pickup_deadline]);

  /*
   * Browser mengubah waktu local
   * menjadi ISO UTC.
   */

  const deadlineIso = deadlineLocal
    ? new Date(deadlineLocal).toISOString()
    : "";

  const statusEditable =
    product.status === "draft" || product.status === "active";

  const archived = product.status === "archived";

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="text-sm font-medium">Nama Produk</label>

        <input
          name="name"
          defaultValue={product.name}
          disabled={archived}
          required
          className="mt-2 w-full rounded-lg border px-4 py-3 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Kategori</label>

        <select
          name="categoryId"
          defaultValue={product.category_id}
          disabled={archived}
          className="mt-2 w-full rounded-lg border px-4 py-3"
        >
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
          rows={5}
          defaultValue={product.description ?? ""}
          disabled={archived}
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
            defaultValue={Number(product.normal_price)}
            disabled={archived}
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
            defaultValue={Number(product.surplus_price)}
            disabled={archived}
            required
            className="mt-2 w-full rounded-lg border px-4 py-3"
          />
        </div>
      </div>

      {/* STOCK */}

      <div>
        <label className="text-sm font-medium">Stok</label>

        <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3">
          <strong>{product.available_stock}</strong> stok tersedia
        </div>

        <p className="mt-1 text-xs text-gray-500">
          Stok hanya dapat diubah melalui halaman Inventory.
        </p>
      </div>

      {/* DEADLINE */}

      <div>
        <label className="text-sm font-medium">Batas Pengambilan</label>

        <input
          type="datetime-local"
          value={deadlineLocal}
          disabled={archived}
          onChange={(event) => setDeadlineLocal(event.target.value)}
          required
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />

        <input type="hidden" name="pickupDeadline" value={deadlineIso} />
      </div>

      {/* STATUS */}

      <div>
        <label className="text-sm font-medium">Status</label>

        {statusEditable ? (
          <select
            name="status"
            defaultValue={product.status}
            className="mt-2 w-full rounded-lg border px-4 py-3"
          >
            <option value="draft">Draft</option>

            <option value="active">Aktif</option>
          </select>
        ) : (
          <>
            <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 capitalize">
              {product.status}
            </div>

            <input type="hidden" name="status" value={product.status} />
          </>
        )}
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

      {!archived && (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      )}
    </form>
  );
}
