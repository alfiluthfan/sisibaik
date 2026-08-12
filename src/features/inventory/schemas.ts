import { z } from "zod";

export const stockAdjustmentSchema = z
  .object({
    productId: z.string().uuid(),

    activityType: z.enum(["restock", "manual_reduction", "adjustment"]),

    quantityChange: z.coerce
      .number()
      .int()
      .refine((value) => value !== 0, "Perubahan stok tidak boleh 0."),

    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.activityType === "restock" && data.quantityChange <= 0) {
      ctx.addIssue({
        code: "custom",

        path: ["quantityChange"],

        message: "Restock harus menggunakan angka positif.",
      });
    }

    if (data.activityType === "manual_reduction" && data.quantityChange >= 0) {
      ctx.addIssue({
        code: "custom",

        path: ["quantityChange"],

        message: "Pengurangan harus menggunakan angka negatif.",
      });
    }

    if (data.activityType === "adjustment" && !data.notes) {
      ctx.addIssue({
        code: "custom",

        path: ["notes"],

        message: "Adjustment wajib menyertakan catatan.",
      });
    }
  });
