import { z } from "zod";

export const loginSchema = z.object({
  tenantSlug: z
    .string()
    .trim()
    .min(1, "Kode klub wajib diisi")
    .toLowerCase(),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter")
  .regex(/[a-zA-Z]/, "Kata sandi harus mengandung huruf")
  .regex(/[0-9]/, "Kata sandi harus mengandung angka");

export const changePasswordSchema = z.object({
  newPassword: passwordSchema,
});
