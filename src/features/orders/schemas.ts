import { z } from "zod";

export const reservationSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Minimal reservasi 1 produk.")
    .max(20, "Maksimal 20 produk per reservasi."),
});

export const pickupVerificationSchema = z.object({
  pickupCode: z
    .string()
    .trim()
    .length(8, "Pickup code harus terdiri dari 8 karakter.")
    .transform((value) => value.toUpperCase()),
});

export const cancelReservationSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Alasan maksimal 500 karakter.")
    .optional(),
});
