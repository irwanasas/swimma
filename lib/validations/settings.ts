import { z } from "zod";

export const tenantBrandingSchema = z.object({
  name: z.string().trim().min(1, "Nama klub wajib diisi"),
  logoUrl: z.string().trim().url("URL logo tidak valid").optional(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Gunakan format warna hex, mis. #2563eb")
    .optional(),
});
