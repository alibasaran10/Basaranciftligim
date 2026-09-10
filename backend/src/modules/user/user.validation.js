import { z } from 'zod';
import { ROLE_VALUES, USER_STATUS } from '../../common/constants.js';

const isoDate = z.string().datetime({ offset: true });

/** Parola politikasi: en az 8 karakter, harf + rakam. */
const password = z
  .string()
  .min(8, 'Parola en az 8 karakter olmali')
  .max(72, 'Parola en fazla 72 karakter olabilir')
  .regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, 'Parola en az bir harf icermeli')
  .regex(/\d/, 'Parola en az bir rakam icermeli');

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email('Gecersiz e-posta').max(160),
    password,
    role: z.enum(ROLE_VALUES).optional(),
    phone: z.string().trim().max(30).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    accessScope: z.string().trim().max(160).optional(),
    status: z.nativeEnum(USER_STATUS).optional(),
    birthDate: isoDate.optional(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    phone: z.string().trim().max(30).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    accessScope: z.string().trim().max(160).optional(),
    status: z.nativeEnum(USER_STATUS).optional(),
    birthDate: isoDate.optional(),
    avatarUrl: z.string().trim().max(300).optional(),
    gender: z.enum(['erkek', 'kadin']).optional(),
  })
  .strict();

/** Kullanicinin kendi profilini guncellemesi (rol/durum degistiremez). */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    birthDate: isoDate.optional(),
    avatarUrl: z.string().trim().max(300).optional(),
    gender: z.enum(['erkek', 'kadin']).optional(),
  })
  .strict();

export const listUsersQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    status: z.nativeEnum(USER_STATUS).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  listUsersQuerySchema,
};
