"use client";

import { useActionState } from "react";

import {
  reserveProductAction,
  type ReservationState,
} from "@/features/orders/actions";

interface ReservationFormProps {
  productId: string;

  availableStock: number;

  price: number;
}

const initialState: ReservationState = {};

export function ReservationForm({
  productId,
  availableStock,
  price,
}: ReservationFormProps) {
  const action = reserveProductAction.bind(null, productId);

  const [state, formAction, pending] = useActionState(action, initialState);

  const maxQuantity = Math.min(availableStock, 20);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="quantity" className="text-sm font-medium">
          Jumlah
        </label>

        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxQuantity}
          defaultValue={1}
          required
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          Maksimal {maxQuantity} item berdasarkan stok saat ini.
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Harga per item</span>

          <strong>
            Rp
            {price.toLocaleString("id-ID")}
          </strong>
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || availableStock <= 0}
        className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Memproses Reservasi..." : "Reservasi Makanan"}
      </button>
    </form>
  );
}
