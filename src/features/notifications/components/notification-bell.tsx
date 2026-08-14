"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

interface NotificationBellProps {
  userId: string;

  initialUnreadCount: number;
}

interface RealtimeNotification {
  id: string;

  title: string;

  message: string;

  target_path: string | null;
}

export function NotificationBell({
  userId,
  initialUnreadCount,
}: NotificationBellProps) {
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const [latestNotification, setLatestNotification] =
    useState<RealtimeNotification | null>(null);

  /*
   * Sinkronkan kembali ketika
   * Server Component refresh.
   */
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)

      .on(
        "postgres_changes",

        {
          event: "INSERT",

          schema: "public",

          table: "notifications",

          filter: `user_id=eq.${userId}`,
        },

        (payload) => {
          const notification = payload.new as RealtimeNotification;

          setUnreadCount((current) => current + 1);

          setLatestNotification(notification);

          /*
           * Refresh Server Components:
           *
           * - merchant orders
           * - customer orders
           * - notification count
           */

          router.refresh();

          window.setTimeout(() => {
            setLatestNotification((current) =>
              current?.id === notification.id ? null : current,
            );
          }, 5000);
        },
      )

      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime notification error:", error);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return (
    <>
      {/* NOTIFICATION BELL */}

      <Link
        href="/notifications"
        aria-label="Notifikasi"
        className="fixed right-6 top-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border bg-white text-lg shadow-sm"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {/* SIMPLE REALTIME TOAST */}

      {latestNotification && (
        <Link
          href={latestNotification.target_path ?? "/notifications"}
          className="fixed right-6 top-20 z-50 w-[340px] rounded-2xl border bg-white p-4 shadow-xl"
        >
          <p className="font-semibold">{latestNotification.title}</p>

          <p className="mt-1 text-sm text-gray-500">
            {latestNotification.message}
          </p>
        </Link>
      )}
    </>
  );
}
