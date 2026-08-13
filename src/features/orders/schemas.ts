import { z } from "zod";

export const reservationSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Minimal reservasi 1 produk.")
    .max(20, "Maksimal 20 produk per reservasi."),
});
