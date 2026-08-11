import { z } from "zod";


export const merchantOnboardingSchema =
  z.object({

    businessName:
      z.string()
        .trim()
        .min(
          2,
          "Nama usaha minimal 2 karakter."
        )
        .max(
          150,
          "Nama usaha maksimal 150 karakter."
        ),

    description:
      z.string()
        .trim()
        .max(
          1000,
          "Deskripsi maksimal 1000 karakter."
        )
        .optional(),

    phone:
      z.string()
        .trim()
        .min(
          8,
          "Nomor telepon tidak valid."
        )
        .max(
          20,
          "Nomor telepon terlalu panjang."
        ),

    address:
      z.string()
        .trim()
        .min(
          10,
          "Alamat terlalu singkat."
        )
        .max(
          500,
          "Alamat terlalu panjang."
        ),

    latitude:
      z.coerce
        .number()
        .min(-90)
        .max(90)
        .optional(),

    longitude:
      z.coerce
        .number()
        .min(-180)
        .max(180)
        .optional(),

  });