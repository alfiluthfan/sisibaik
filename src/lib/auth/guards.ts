import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { Profile, UserRole } from "@/types/auth";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  /*
   * getClaims memvalidasi JWT.
   */
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return null;
  }

  const userId = claimsData.claims.sub;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        name,
        role,
        status,
        avatar_url,
        created_at,
        updated_at
      `,
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile as Profile;
}

export async function requireAuth() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  return profile;
}

export async function requireRole(allowedRole: UserRole) {
  const profile = await requireAuth();

  if (profile.status === "suspended") {
    redirect("/account-suspended");
  }

  if (profile.role !== allowedRole) {
    redirect("/dashboard");
  }

  return profile;
}
