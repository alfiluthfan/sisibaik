import Link from "next/link";

import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Daftar SisiBaik
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Bergabung dan bantu mengurangi
            makanan terbuang.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah memiliki akun?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-black underline"
          >
            Masuk
          </Link>
        </p>
      </section>
    </main>
  );
}