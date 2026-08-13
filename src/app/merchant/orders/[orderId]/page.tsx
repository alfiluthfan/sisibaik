import Link from "next/link";

import { notFound } from "next/navigation";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";

import { PickupVerificationForm } from "@/features/orders/components/pickup-verification-form";

interface Props {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function MerchantOrderDetailPage({ params }: Props) {
  const { merchant } = await requireApprovedMerchant();

  const { orderId } = await params;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        total_amount,
        pickup_deadline,
        reserved_at,
        picked_up_at,
        cancelled_at,
        cancellation_reason,

        profiles!orders_customer_id_fkey (
          name
        ),

        order_items (
          id,
          product_name,
          unit_price,
          quantity,
          subtotal
        )
      `,
    )

    .eq("id", orderId)

    .eq("merchant_id", merchant.id)

    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/merchant/orders" className="text-sm text-gray-500">
          ← Reservasi Masuk
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border bg-white p-7">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Customer</p>

                <h1 className="mt-1 text-2xl font-bold">
                  {order.profiles?.name}
                </h1>
              </div>

              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-7">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border-t py-4"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>

                    <p className="text-sm text-gray-500">
                      {item.quantity} × Rp
                      {Number(item.unit_price).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <strong>
                    Rp
                    {Number(item.subtotal).toLocaleString("id-ID")}
                  </strong>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t pt-5">
              <span className="font-semibold">Total</span>

              <strong className="text-xl">
                Rp
                {Number(order.total_amount).toLocaleString("id-ID")}
              </strong>
            </div>

            <div className="mt-7 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Batas Pengambilan</p>

              <p className="mt-1 font-medium">
                {new Date(order.pickup_deadline).toLocaleString("id-ID")}
              </p>
            </div>
          </section>

          <aside>
            {order.status === "reserved" ? (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-semibold">Verifikasi Pengambilan</h2>

                <p className="mt-2 text-sm text-gray-500">
                  Minta customer menunjukkan pickup code dari aplikasi.
                </p>

                <div className="mt-5">
                  <PickupVerificationForm orderId={order.id} />
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="font-semibold">Status Reservasi</h2>

                <div className="mt-4">
                  <OrderStatusBadge status={order.status} />
                </div>

                {order.cancelled_at && (
                  <p className="mt-4 text-sm text-gray-500">
                    Dibatalkan:{" "}
                    {new Date(order.cancelled_at).toLocaleString("id-ID")}
                  </p>
                )}

                {order.cancellation_reason && (
                  <p className="mt-2 text-sm">{order.cancellation_reason}</p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
