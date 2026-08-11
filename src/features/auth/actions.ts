"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
} from "@/features/auth/schemas";

import type { AuthActionState } from "@/types/auth";

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Data registrasi tidak valid.",
    };
  }

  const {
    name,
    email,
    password,
    role,
  } = parsed.data;

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          name,
          role,
        },
      },
    });

  if (error) {
    return {
      error: error.message,
    };
  }

  /*
   * Jika email confirmation dimatikan,
   * signup bisa langsung menghasilkan session.
   */
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  /*
   * Jika confirmation aktif,
   * user harus membuka email dahulu.
   */
  redirect("/auth/check-email");
}


export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Data login tidak valid.",
    };
  }

  const {
    email,
    password,
  } = parsed.data;

  const supabase = await createClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    return {
      error:
        "Email atau password tidak valid.",
    };
  }

  revalidatePath("/", "layout");

  /*
   * Jangan redirect role dari form.
   *
   * Semua user masuk ke /dashboard terlebih dahulu.
   * /dashboard menentukan destination berdasarkan
   * profiles.role + profiles.status.
   */
  redirect("/dashboard");
}


export async function logoutAction() {
  const supabase = await createClient();

  const { data } =
    await supabase.auth.getClaims();

  if (data?.claims) {
    await supabase.auth.signOut({
      scope: "local",
    });
  }

  revalidatePath("/", "layout");

  redirect("/auth/login");
}