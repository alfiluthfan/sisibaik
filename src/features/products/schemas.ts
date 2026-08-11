import { z } from "zod";

// 1. Pisahkan skema objek murni ke variabel dasar (tanpa superRefine)
const baseProductSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter").max(150),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().uuid("Kategori tidak valid"),
  normalPrice: z.coerce.number().positive("Harga normal harus lebih dari 0"),
  surplusPrice: z.coerce
    .number()
    .nonnegative("Harga surplus tidak boleh negatif"),
  availableStock: z.coerce.number().int().min(0),
  pickupDeadline: z.string().min(1, "Pickup deadline wajib diisi"),
  status: z.enum(["draft", "active"]),
});

// 2. Tambahkan superRefine untuk skema produk utama (Create)
export const productSchema = baseProductSchema.superRefine((data, ctx) => {
  if (data.surplusPrice > data.normalPrice) {
    ctx.addIssue({
      code: "custom",
      path: ["surplusPrice"],
      message: "Harga surplus tidak boleh lebih besar dari harga normal.",
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
  if (Number.isNaN(deadline.getTime())) {
    ctx.addIssue({
      code: "custom",
      path: ["pickupDeadline"],
      message: "Pickup deadline tidak valid.",
    });
  }
});

// 3. Gunakan base schema untuk membuat update schema, lalu berikan superRefine khusus
export const updateProductSchema = baseProductSchema
  .omit({ availableStock: true }) // Omit beroperasi pada ZodObject murni
  .superRefine((data, ctx) => {
    // Masukkan kembali validasi yang relevan untuk proses update
    if (data.surplusPrice > data.normalPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["surplusPrice"],
        message: "Harga surplus tidak boleh lebih besar dari harga normal.",
      });
    }

    const deadline = new Date(data.pickupDeadline);
    if (Number.isNaN(deadline.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupDeadline"],
        message: "Pickup deadline tidak valid.",
      });
    }

    // Catatan: Validasi stok aktif dihapus di sini karena availableStock sudah di-omit
  });
