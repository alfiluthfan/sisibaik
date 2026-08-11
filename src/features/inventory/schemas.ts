import { z } from "zod";

export const stockSchema = z
  .object({
    productId: z.string().uuid(),

    quantityChange: z.coerce
      .number()
      .int()
      .refine((value) => value !== 0, "Perubahan stok tidak boleh 0"),

    activityType: z.enum(["restock", "manual_reduction", "adjustment"]),

    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.activityType === "restock" && data.quantityChange <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityChange"],
        message: "Restock harus bernilai positif.",
      });
    }

    if (data.activityType === "manual_reduction" && data.quantityChange >= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityChange"],
        message: "Pengurangan stok harus bernilai negatif.",
      });
    }
  });
