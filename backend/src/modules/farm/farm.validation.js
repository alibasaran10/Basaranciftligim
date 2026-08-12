import { z } from 'zod';

export const updateFarmSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    businessType: z.string().trim().max(120).optional(),
    taxNumber: z.string().trim().max(20).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.string().trim().toLowerCase().email('Gecersiz e-posta').max(160).optional(),
    address: z.string().trim().max(300).optional(),
    timezone: z.string().trim().max(60).optional(),
  })
  .strict();

export const updatePreferencesSchema = z
  .object({
    notifications: z.boolean().optional(),
    cameraIntegration: z.boolean().optional(),
    deviceSettings: z.boolean().optional(),
    dataSync: z.boolean().optional(),
    security: z.boolean().optional(),
    apiIntegrations: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
  })
  .strict();

export default { updateFarmSchema, updatePreferencesSchema };
