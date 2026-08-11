import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">
          ✉️
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Periksa Email
        </h1>

        <p className="mt-3 text-gray-600">
          Kami telah mengirim link
          konfirmasi akun.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Klik link tersebut sebelum
          melakukan login.
        </p>

        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Kembali ke Login
        </Link>
      </section>
    </main>
  );
}