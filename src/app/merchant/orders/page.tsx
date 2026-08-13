import Link from "next/link";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";

interface Props {
  searchParams: Promise<{
    status?: string;
  }>;
}

const validStatus = ["reserved", "picked_up", "cancelled", "expired"] as const;

export default async function MerchantOrdersPage({ searchParams }: Props) {
  const { merchant } = await requireApprovedMerchant();

  const params = await searchParams;

  const selectedStatus = validStatus.includes(
    params.status as (typeof validStatus)[number],
  )
    ? params.status
    : "reserved";

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        total_amount,
        pickup_deadline,
        reserved_at,

        profiles!orders_customer_id_fkey (
          name
        ),

        order_items (
          product_name,
          quantity
        )
      `,
    )

    .eq("merchant_id", merchant.id)

    .eq("status", selectedStatus)

    .order("reserved_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div>
          <p className="text-sm text-gray-500">Merchant</p>

          <h1 className="text-3xl font-bold">Reservasi Masuk</h1>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          <Link
            href="/merchant/orders?status=reserved"
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Menunggu Pickup
          </Link>

          <Link
            href="/merchant/orders?status=picked_up"
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Selesai
          </Link>

          <Link
            href="/merchant/orders?status=cancelled"
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Dibatalkan
          </Link>

          <Link
            href="/merchant/orders?status=expired"
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Kedaluwarsa
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Produk</th>

                <th className="p-4 text-left">Customer</th>

                <th className="p-4 text-center">Qty</th>

                <th className="p-4 text-left">Status</th>

                <th className="p-4 text-left">Deadline</th>

                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {orders?.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4 font-medium">
                    {order.order_items?.[0]?.product_name}
                  </td>

                  <td className="p-4">{order.profiles?.name}</td>

                  <td className="p-4 text-center">
                    {order.order_items?.[0]?.quantity}
                  </td>

                  <td className="p-4">
                    <OrderStatusBadge status={order.status} />
                  </td>

                  <td className="p-4 text-sm">
                    {new Date(order.pickup_deadline).toLocaleString("id-ID")}
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/merchant/orders/${order.id}`}
                      className="rounded-lg border px-4 py-2 text-sm"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Tidak ada reservasi dengan status ini.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
