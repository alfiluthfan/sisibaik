"use server";

import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth/guards";

import { createClient } from "@/lib/supabase/server";

function revalidateNotificationLayouts(role: string) {
  revalidatePath("/notifications");

  if (role === "customer") {
    revalidatePath("/customer", "layout");
  }

  if (role === "merchant") {
    revalidatePath("/merchant", "layout");
  }
}

export async function markNotificationReadAction(notificationId: string) {
  const profile = await requireAuth();

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,

      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateNotificationLayouts(profile.role);
}

export async function markAllNotificationsReadAction() {
  const profile = await requireAuth();

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,

      read_at: new Date().toISOString(),
    })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidateNotificationLayouts(profile.role);
}

export async function openNotificationAction(
  notificationId: string,

  targetPath: string | null,
) {
  const profile = await requireAuth();

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,

      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  /*
   * Hindari open redirect.
   */

  const safeTarget =
    targetPath && targetPath.startsWith("/") && !targetPath.startsWith("//")
      ? targetPath
      : "/notifications";

  redirect(safeTarget);
}
