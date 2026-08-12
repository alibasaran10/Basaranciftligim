import { z } from 'zod';

// Guclu parola: en az 8 karakter, harf + rakam. (Uretimde daha siki kural + HIBP kontrolu.)
const passwordField = z
  .string()
  .min(8, 'Parola en az 8 karakter olmali')
  .max(128)
  .regex(/[A-Za-z]/, 'Parola en az bir harf icermeli')
  .regex(/[0-9]/, 'Parola en az bir rakam icermeli');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(160),
    password: passwordField,
    farmName: z.string().trim().min(2).max(160),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(160),
    password: z.string().min(1).max(128),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(10),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordField,
  })
  .strict();

export default { registerSchema, loginSchema, refreshSchema, changePasswordSchema };
