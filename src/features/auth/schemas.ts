import { z } from "zod";

export const publicRoleSchema = z.enum([
  "customer",
  "merchant",
  "organization",
]);

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),

  email: z
    .string()
    .trim()
    .email("Format email tidak valid"),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter"),

  role: publicRoleSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid"),

  password: z
    .string()
    .min(1, "Password wajib diisi"),
});