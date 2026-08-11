"use client";

import { useActionState } from "react";

import { registerAction } from "@/features/auth/actions";

const initialState = {
  error: "",
  success: "",
};

export function RegisterForm() {
  const [state, formAction, pending] =
    useActionState(
      registerAction,
      initialState
    );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium"
        >
          Nama
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Nama lengkap"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="nama@email.com"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Minimal 8 karakter"
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="role"
          className="text-sm font-medium"
        >
          Daftar sebagai
        </label>

        <select
          id="role"
          name="role"
          required
          defaultValue="customer"
          className="w-full rounded-lg border px-4 py-3"
        >
          <option value="customer">
            Pengguna
          </option>

          <option value="merchant">
            Mitra UMKM
          </option>

          <option value="organization">
            Organisasi Sosial
          </option>
        </select>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending
          ? "Mendaftarkan..."
          : "Daftar"}
      </button>
    </form>
  );
}