import Link from "next/link";

import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";

export default async function CustomerOrdersPage() {
  await requireRole("customer");

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        total_amount,
        pickup_code,
        pickup_deadline,
        reserved_at,

        merchant_profiles (
          business_name,
          address
        ),

        order_items (
          product_name,
          quantity
        )
      `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm text-gray-500">Customer</p>

          <h1 className="text-3xl font-bold">Reservasi Saya</h1>
        </div>

        <div className="mt-8 space-y-4">
          {orders?.map((order) => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}`}
              className="block rounded-2xl border bg-white p-6 transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {order.order_items?.[0]?.product_name ?? "Reservasi"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {order.merchant_profiles?.business_name}
                  </p>
                </div>

                <OrderStatusBadge status={order.status} />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Jumlah</p>

                  <p className="font-medium">
                    {order.order_items?.[0]?.quantity ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Total</p>

                  <p className="font-medium">
                    Rp
                    {Number(order.total_amount).toLocaleString("id-ID")}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Pickup Code</p>

                  <p className="font-mono font-bold tracking-widest">
                    {order.pickup_code}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {orders?.length === 0 && (
            <div className="rounded-2xl border bg-white p-12 text-center">
              <p className="font-semibold">Belum ada reservasi</p>

              <Link
                href="/marketplace"
                className="mt-4 inline-block rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Cari Makanan
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
