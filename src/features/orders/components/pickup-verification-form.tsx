"use client";

import { useActionState } from "react";

import {
  completePickupAction,
  type PickupActionState,
} from "@/features/orders/merchant-actions";

interface Props {
  orderId: string;
}

const initialState: PickupActionState = {};

export function PickupVerificationForm({ orderId }: Props) {
  const action = completePickupAction.bind(null, orderId);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Pickup Code</label>

        <input
          name="pickupCode"
          maxLength={8}
          minLength={8}
          autoComplete="off"
          placeholder="AB12CD34"
          required
          className="mt-2 w-full rounded-xl border px-4 py-3 text-center font-mono text-2xl font-bold uppercase tracking-[0.25em]"
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
        className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Memverifikasi..." : "Verifikasi & Selesaikan Pickup"}
      </button>
    </form>
  );
}
