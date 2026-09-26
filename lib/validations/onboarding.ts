import { z } from "zod";
import { passwordSchema } from "./auth";

export const registerClubSchema = z.object({
  tenantName: z.string().trim().min(2, "Nama klub wajib diisi"),
  tenantSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Kode klub minimal 2 karakter")
    .regex(/^[a-z0-9-]+$/, "Kode klub hanya boleh huruf kecil, angka, dan tanda hubung (-)"),
  adminFullName: z.string().trim().min(2, "Nama Anda wajib diisi"),
  adminEmail: z.string().email("Email tidak valid"),
  password: passwordSchema,
});
