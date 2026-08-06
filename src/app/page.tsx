import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">
        SisiBaik
      </h1>

      <p className="mt-2 text-gray-600">
        Integrated Food Surplus Management System
      </p>

      <pre className="mt-8 rounded-lg bg-gray-100 p-4">
        {JSON.stringify(
          {
            profiles: data,
            error: error?.message,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}