import { z } from 'zod';
import { polygonSchema } from '../../common/validation/common.schemas.js';

const macField = z
  .string()
  .trim()
  .regex(/^([0-9A-Fa-f]{2}[:-]?){5}[0-9A-Fa-f]{2}$/, 'Gecersiz MAC adresi');

export const createZoneSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    routerMacs: z.array(macField).max(20).optional(),
    boundary: polygonSchema.optional(),
  })
  .strict();

export const updateZoneSchema = createZoneSchema.partial().strict();

export default { createZoneSchema, updateZoneSchema };
