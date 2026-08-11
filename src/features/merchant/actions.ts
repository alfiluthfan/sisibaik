"use server";

import {
  redirect,
} from "next/navigation";

import {
  revalidatePath,
} from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  requireRole,
} from "@/lib/auth/guards";

import {
  merchantOnboardingSchema,
} from "./schemas";


export async function createMerchantProfileAction(
  formData: FormData
) {

  const profile =
    await requireRole(
      "merchant"
    );


  const parsed =
    merchantOnboardingSchema.safeParse({

      businessName:
        formData.get(
          "businessName"
        ),

      description:
        formData.get(
          "description"
        ),

      phone:
        formData.get(
          "phone"
        ),

      address:
        formData.get(
          "address"
        ),

      latitude:
        formData.get(
          "latitude"
        ) || undefined,

      longitude:
        formData.get(
          "longitude"
        ) || undefined,

    });


  if (!parsed.success) {

    return {
      success: false,

      error:
        parsed.error
          .issues[0]
          ?.message
        ?? "Data tidak valid.",
    };

  }


  const supabase =
    await createClient();


  /*
   * Pastikan merchant belum
   * mempunyai merchant_profiles.
   */

  const {
    data: existing,
  } = await supabase
    .from("merchant_profiles")
    .select("id")
    .eq(
      "user_id",
      profile.id
    )
    .maybeSingle();


  if (existing) {

    return {
      success: false,
      error:
        "Profil UMKM sudah tersedia.",
    };

  }


  const {
    error,
  } = await supabase
    .from("merchant_profiles")
    .insert({

      user_id:
        profile.id,

      business_name:
        parsed.data.businessName,

      description:
        parsed.data.description
        || null,

      phone:
        parsed.data.phone,

      address:
        parsed.data.address,

      latitude:
        parsed.data.latitude
        ?? null,

      longitude:
        parsed.data.longitude
        ?? null,

    });


  if (error) {

    return {
      success: false,
      error: error.message,
    };

  }


  revalidatePath(
    "/merchant"
  );

  revalidatePath(
    "/merchant/verification"
  );


  redirect(
    "/merchant/verification"
  );
}