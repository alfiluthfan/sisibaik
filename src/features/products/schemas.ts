import { z } from "zod";

// 1. Buat skema dasar (Base Schema) TANPA superRefine
const baseProductSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter.").max(150),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().uuid("Kategori tidak valid."),
  normalPrice: z.coerce.number().positive("Harga normal harus lebih dari 0."),
  surplusPrice: z.coerce.number().min(0, "Harga surplus tidak boleh negatif."),
  availableStock: z.coerce.number().int().min(0, "Stok tidak boleh negatif."),
  pickupDeadline: z.string().min(1, "Batas pengambilan wajib diisi."),
  status: z.enum(["draft", "active"]),
});

// 2. Tambahkan superRefine ke base schema untuk createProductSchema
export const createProductSchema = baseProductSchema.superRefine(
  (data, ctx) => {
    if (data.surplusPrice > data.normalPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["surplusPrice"],
        message: "Harga surplus tidak boleh melebihi harga normal.",
      });
    }

    if (data.status === "active" && data.availableStock <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["availableStock"],
        message: "Produk aktif harus memiliki stok.",
      });
    }

    const deadline = new Date(data.pickupDeadline);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupDeadline"],
        message: "Pickup deadline harus berada di masa depan.",
      });
    }
  },
);

// 3. Lakukan .omit() pada base schema, lalu buat superRefine baru khusus update
export const updateProductSchema = baseProductSchema
  .omit({ availableStock: true }) // Omit sekarang berjalan di ZodObject murni
  .superRefine((data, ctx) => {
    // Pengecekan surplus price tetap dimasukkan
    if (data.surplusPrice > data.normalPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["surplusPrice"],
        message: "Harga surplus tidak boleh melebihi harga normal.",
      });
    }

    // Pengecekan availableStock dihapus di sini karena field-nya sudah di-omit

    // Pengecekan deadline tetap dimasukkan
    const deadline = new Date(data.pickupDeadline);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupDeadline"],
        message: "Pickup deadline harus berada di masa depan.",
      });
    }
  });
