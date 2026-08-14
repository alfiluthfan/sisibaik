import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

import { NotificationBell } from "@/features/notifications/components/notification-bell";

export default async function CustomerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("customer");

  const supabase = await createClient();

  const { count } = await supabase
    .from("notifications")
    .select("id", {
      count: "exact",

      head: true,
    })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  return (
    <>
      <NotificationBell userId={profile.id} initialUnreadCount={count ?? 0} />

      {children}
    </>
  );
}
