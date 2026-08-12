"use client";

import { useActionState } from "react";

import { reviewMerchantAction, type MerchantReviewState } from "../actions";

interface MerchantReviewFormProps {
  merchantId: string;
}

const initialState: MerchantReviewState = {};

export function MerchantReviewForm({ merchantId }: MerchantReviewFormProps) {
  const reviewAction = reviewMerchantAction.bind(null, merchantId);

  const [state, formAction, pending] = useActionState(
    reviewAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="rejectionReason" className="text-sm font-medium">
          Alasan Penolakan
        </label>

        <textarea
          id="rejectionReason"
          name="rejectionReason"
          rows={4}
          placeholder="Isi jika pengajuan ditolak..."
          className="mt-2 w-full rounded-lg border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          Wajib diisi jika memilih Tolak Merchant.
        </p>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Tolak Merchant"}
        </button>

        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Setujui Merchant"}
        </button>
      </div>
    </form>
  );
}
