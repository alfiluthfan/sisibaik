import { requireAuth } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import {
  markAllNotificationsReadAction,
  openNotificationAction,
} from "@/features/notifications/actions";

export default async function NotificationsPage() {
  const profile = await requireAuth();

  const supabase = await createClient();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(
      `
        id,
        type,
        title,
        message,
        order_id,
        target_path,
        is_read,
        read_at,
        created_at
      `,
    )
    .eq("user_id", profile.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const unread = (notifications ?? []).filter((item) => !item.is_read).length;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">SisiBaik</p>

            <h1 className="text-3xl font-bold">Notifikasi</h1>

            <p className="mt-2 text-gray-600">
              {unread} notifikasi belum dibaca
            </p>
          </div>

          {unread > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                className="rounded-xl border bg-white px-4 py-2 text-sm font-medium"
              >
                Tandai Semua Dibaca
              </button>
            </form>
          )}
        </div>

        {/* NOTIFICATIONS */}

        <div className="mt-8 space-y-3">
          {notifications?.map((notification) => (
            <article
              key={notification.id}
              className={`
                  rounded-2xl
                  border
                  p-5

                  ${
                    notification.is_read
                      ? "bg-white"
                      : "bg-blue-50/50 border-blue-100"
                  }
                `}
            >
              <div className="flex gap-4">
                {/* STATUS DOT */}

                <div className="pt-2">
                  <span
                    className={`
                        block
                        h-2
                        w-2
                        rounded-full

                        ${notification.is_read ? "bg-gray-300" : "bg-blue-600"}
                      `}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{notification.title}</h2>

                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString("id-ID")}
                  </p>

                  {notification.target_path && (
                    <form
                      action={openNotificationAction.bind(
                        null,
                        notification.id,
                        notification.target_path,
                      )}
                      className="mt-4"
                    >
                      <button
                        type="submit"
                        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium"
                      >
                        Buka Detail
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}

          {notifications?.length === 0 && (
            <div className="rounded-2xl border bg-white p-12 text-center">
              <div className="text-5xl">🔔</div>

              <h2 className="mt-4 font-semibold">Belum ada notifikasi</h2>

              <p className="mt-1 text-sm text-gray-500">
                Aktivitas reservasi akan muncul di sini.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
