"use client";

import { useActionState } from "react";

import {
  cancelReservationAction,
  type CancelReservationState,
} from "@/features/orders/customer-actions";

interface Props {
  orderId: string;
}

const initialState: CancelReservationState = {};

export function CancelReservationForm({ orderId }: Props) {
  const action = cancelReservationAction.bind(null, orderId);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Alasan pembatalan</label>

        <textarea
          name="reason"
          rows={3}
          maxLength={500}
          placeholder="Opsional..."
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />
      </div>

      {state.error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 disabled:opacity-50"
      >
        {pending ? "Membatalkan..." : "Batalkan Reservasi"}
      </button>
    </form>
  );
}
