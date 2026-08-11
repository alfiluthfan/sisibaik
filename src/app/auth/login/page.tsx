import Link from "next/link";

import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Masuk SisiBaik
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Masuk untuk melanjutkan aktivitasmu.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-gray-600">
          Belum memiliki akun?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-black underline"
          >
            Daftar
          </Link>
        </p>
      </section>
    </main>
  );
}