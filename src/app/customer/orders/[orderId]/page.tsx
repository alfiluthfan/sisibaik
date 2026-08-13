import Link from "next/link";

import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";

import { CancelReservationForm } from "@/features/orders/components/cancel-reservation-form";

interface Props {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function CustomerOrderDetailPage({ params }: Props) {
  await requireRole("customer");

  const { orderId } = await params;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        total_amount,
        pickup_code,
        pickup_deadline,
        reserved_at,
        picked_up_at,
        cancelled_at,

        merchant_profiles (
          id,
          business_name,
          address,
          phone
        ),

        order_items (
          id,
          product_id,
          product_name,
          unit_price,
          quantity,
          subtotal
        )
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/customer/orders" className="text-sm text-gray-500">
          ← Reservasi Saya
        </Link>

        <section className="mt-6 rounded-3xl border bg-white p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Reservasi</p>

              <h1 className="mt-1 text-2xl font-bold">
                {order.order_items?.[0]?.product_name}
              </h1>
            </div>

            <OrderStatusBadge status={order.status} />
          </div>

          {/* PICKUP CODE */}

          {order.status === "reserved" && (
            <div className="mt-8 rounded-2xl bg-gray-950 p-8 text-center text-white">
              <p className="text-sm text-gray-300">Kode Pengambilan</p>

              <p className="mt-3 font-mono text-4xl font-bold tracking-[0.3em]">
                {order.pickup_code}
              </p>

              <p className="mt-4 text-xs text-gray-400">
                Tunjukkan kode ini kepada merchant saat mengambil makanan.
              </p>
            </div>
          )}

          {/* ITEM */}

          <div className="mt-8 border-t pt-6">
            <h2 className="font-semibold">Detail Pesanan</h2>

            {order.order_items?.map((item) => (
              <div key={item.id} className="mt-4 flex justify-between">
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

          {/* TOTAL */}

          <div className="mt-6 flex justify-between border-t pt-5">
            <span className="font-semibold">Total</span>

            <span className="text-xl font-bold">
              Rp
              {Number(order.total_amount).toLocaleString("id-ID")}
            </span>
          </div>

          {/* PICKUP */}

          <div className="mt-8 rounded-2xl bg-gray-50 p-5">
            <h2 className="font-semibold">Lokasi Pengambilan</h2>

            <p className="mt-3 font-medium">
              {order.merchant_profiles?.business_name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {order.merchant_profiles?.address}
            </p>

            <div className="mt-5 border-t pt-4">
              <p className="text-xs text-gray-500">Ambil sebelum</p>

              <p className="mt-1 font-semibold">
                {new Date(order.pickup_deadline).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {order.status === "reserved" &&
            new Date(order.pickup_deadline) > new Date() && (
              <section className="mt-8 rounded-2xl border border-red-100 p-6">
                <h2 className="font-semibold">Batalkan Reservasi</h2>

                <p className="mt-2 text-sm text-gray-500">
                  Stok makanan akan dikembalikan agar dapat dipesan pengguna
                  lain.
                </p>

                <div className="mt-5">
                  <CancelReservationForm orderId={order.id} />
                </div>
              </section>
            )}
        </section>
      </div>
    </main>
  );
}
