"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { requireApprovedMerchant } from "@/lib/merchant/get-merchant";

import { createClient } from "@/lib/supabase/server";

import { createProductSchema, updateProductSchema } from "./schemas";

export interface ProductActionState {
  error?: string;
  success?: string;
}

export async function createProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { merchant } = await requireApprovedMerchant();

  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),

    description: formData.get("description"),

    categoryId: formData.get("categoryId"),

    normalPrice: formData.get("normalPrice"),

    surplusPrice: formData.get("surplusPrice"),

    availableStock: formData.get("availableStock"),

    pickupDeadline: formData.get("pickupDeadline"),

    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data produk tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      merchant_id: merchant.id,

      category_id: parsed.data.categoryId,

      name: parsed.data.name,

      description: parsed.data.description || null,

      normal_price: parsed.data.normalPrice,

      surplus_price: parsed.data.surplusPrice,

      available_stock: parsed.data.availableStock,

      pickup_deadline: new Date(parsed.data.pickupDeadline).toISOString(),

      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/merchant/products");

  revalidatePath("/merchant/inventory");

  redirect(`/merchant/products/${data.id}/edit`);
}

// export async function updateProductAction(
//   productId: string,
//   _previousState: ProductActionState,
//   formData: FormData,
// ): Promise<ProductActionState> {
//   const { merchant } = await requireApprovedMerchant();

//   const parsed = updateProductSchema.safeParse({
//     name: formData.get("name"),

//     description: formData.get("description"),

//     categoryId: formData.get("categoryId"),

//     normalPrice: formData.get("normalPrice"),

//     surplusPrice: formData.get("surplusPrice"),

//     pickupDeadline: formData.get("pickupDeadline"),

//     status: formData.get("status"),
//   });

//   if (!parsed.success) {
//     return {
//       error: parsed.error.issues[0]?.message ?? "Data produk tidak valid.",
//     };
//   }

//   const supabase = await createClient();

//   const { error } = await supabase
//     .from("products")
//     .update({
//       category_id: parsed.data.categoryId,

//       name: parsed.data.name,

//       description: parsed.data.description || null,

//       normal_price: parsed.data.normalPrice,

//       surplus_price: parsed.data.surplusPrice,

//       pickup_deadline: new Date(parsed.data.pickupDeadline).toISOString(),

//       status: parsed.data.status,
//     })
//     .eq("id", productId)
//     .eq("merchant_id", merchant.id);

//   if (error) {
//     return {
//       error: error.message,
//     };
//   }

//   revalidatePath("/merchant/products");

//   revalidatePath(`/merchant/products/${productId}/edit`);

//   return {
//     success: "Produk berhasil diperbarui.",
//   };
// }

export async function updateProductAction(
  productId: string,
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { merchant } = await requireApprovedMerchant();

  const parsed = updateProductSchema.safeParse({
    name: formData.get("name"),

    description: formData.get("description"),

    categoryId: formData.get("categoryId"),

    normalPrice: formData.get("normalPrice"),

    surplusPrice: formData.get("surplusPrice"),

    pickupDeadline: formData.get("pickupDeadline"),

    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data produk tidak valid.",
    };
  }

  const supabase = await createClient();

  // ===========================
  // CURRENT PRODUCT
  // ===========================

  const { data: currentProduct, error: productError } = await supabase
    .from("products")
    .select(
      `
        id,
        available_stock,
        status
      `,
    )
    .eq("id", productId)
    .eq("merchant_id", merchant.id)
    .maybeSingle();

  if (productError || !currentProduct) {
    return {
      error: "Produk tidak ditemukan.",
    };
  }

  if (currentProduct.status === "archived") {
    return {
      error: "Produk yang sudah diarsipkan tidak dapat diedit.",
    };
  }

  /*
   * System-controlled statuses tidak
   * boleh diubah manual dari halaman edit.
   */

  if (
    (currentProduct.status === "sold_out" ||
      currentProduct.status === "expired") &&
    parsed.data.status !== currentProduct.status
  ) {
    return {
      error: "Status produk ini dikelola otomatis oleh sistem.",
    };
  }

  if (parsed.data.status === "active" && currentProduct.available_stock <= 0) {
    return {
      error: "Produk tanpa stok tidak dapat diaktifkan.",
    };
  }

  // ===========================
  // UPDATE
  // ===========================

  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId,

      name: parsed.data.name,

      description: parsed.data.description || null,

      normal_price: parsed.data.normalPrice,

      surplus_price: parsed.data.surplusPrice,

      pickup_deadline: new Date(parsed.data.pickupDeadline).toISOString(),

      status: parsed.data.status,
    })
    .eq("id", productId)
    .eq("merchant_id", merchant.id);

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/merchant/products");

  revalidatePath(`/merchant/products/${productId}/edit`);

  return {
    success: "Produk berhasil diperbarui.",
  };
}

export async function archiveProductAction(productId: string) {
  const { merchant } = await requireApprovedMerchant();

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      status: "archived",
    })
    .eq("id", productId)
    .eq("merchant_id", merchant.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/merchant/products");

  revalidatePath("/merchant/inventory");
}
