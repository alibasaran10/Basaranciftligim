import { z } from 'zod';
import { CROP_RECORD_TYPE, CROP_RECORD_STATUS } from '../../common/constants.js';
import { objectId } from '../../common/validation/common.schemas.js';

const isoDate = z.string().datetime({ offset: true });

export const createCropRecordSchema = z
  .object({
    field: objectId,
    type: z.nativeEnum(CROP_RECORD_TYPE),
    date: isoDate.optional(),
    crop: z.string().trim().min(1).max(80),
    variety: z.string().trim().max(80).optional(),
    areaDonum: z.number().min(0).max(1000000).optional(),
    amount: z.number().min(0).optional(),
    unit: z.string().trim().max(20).optional(),
    method: z.string().trim().max(60).optional(),
    cost: z.number().min(0).optional(),
    revenue: z.number().min(0).optional(),
    yieldPerDonum: z.number().min(0).optional(),
    status: z.nativeEnum(CROP_RECORD_STATUS).optional(),
    season: z.string().trim().max(20).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateCropRecordSchema = createCropRecordSchema.partial().strict();

export const listCropRecordsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    type: z.nativeEnum(CROP_RECORD_TYPE).optional(),
    status: z.nativeEnum(CROP_RECORD_STATUS).optional(),
    crop: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export const summaryQuerySchema = z
  .object({ type: z.nativeEnum(CROP_RECORD_TYPE).optional() })
  .strict();

export default {
  createCropRecordSchema,
  updateCropRecordSchema,
  listCropRecordsQuerySchema,
  summaryQuerySchema,
};
