import { z } from 'zod';
import { FIELD_OPERATION, IRRIGATION_STATUS } from '../../common/constants.js';
import { polygonSchema } from '../../common/validation/common.schemas.js';

const isoDate = z.string().datetime({ offset: true });

const irrigationSchema = z
  .object({
    method: z.string().trim().max(60).optional(),
    status: z.nativeEnum(IRRIGATION_STATUS).optional(),
    moisturePercent: z.number().min(0).max(100).optional(),
    lastIrrigatedAt: isoDate.optional(),
  })
  .strict();

export const createFieldSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().max(40).optional(),
    crop: z.string().trim().max(80).optional(),
    cropVariety: z.string().trim().max(80).optional(),
    soilType: z.string().trim().max(80).optional(),
    boundary: polygonSchema, // uydu uzerinde cizilen alan zorunlu
    areaHectares: z.number().positive().optional(),
    areaDonum: z.number().positive().optional(),
    irrigation: irrigationSchema.optional(),
    growthStage: z.string().trim().max(80).optional(),
    sowingDate: isoDate.optional(),
    expectedHarvestDate: isoDate.optional(),
    altitudeMeters: z.number().min(0).max(6000).optional(),
    slopePercent: z.number().min(0).max(100).optional(),
    locality: z.string().trim().max(160).optional(),
    imageUrl: z.string().trim().max(300).optional(),
    expectedYieldPerDonum: z.number().min(0).optional(),
    actualYieldPerDonum: z.number().min(0).optional(),
    yieldUnit: z.string().trim().max(20).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateFieldSchema = createFieldSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .strict();

export const addOperationSchema = z
  .object({
    type: z.nativeEnum(FIELD_OPERATION),
    date: isoDate.optional(),
    notes: z.string().trim().max(500).optional(),
    // Verim/olcum: serbest anahtar-deger; sayisal degerler beklenir.
    metrics: z.record(z.string().max(40), z.number().finite()).optional(),
  })
  .strict();

export const listFieldsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    crop: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default {
  createFieldSchema,
  updateFieldSchema,
  addOperationSchema,
  listFieldsQuerySchema,
};
