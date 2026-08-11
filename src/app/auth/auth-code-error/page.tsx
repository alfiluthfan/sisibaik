import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-bold">
          Konfirmasi Gagal
        </h1>

        <p className="mt-3 text-gray-600">
          Link konfirmasi tidak valid
          atau sudah kedaluwarsa.
        </p>

        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
        >
          Kembali ke Login
        </Link>
      </section>
    </main>
  );
}