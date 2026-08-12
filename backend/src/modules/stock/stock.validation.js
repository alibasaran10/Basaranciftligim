import { z } from 'zod';
import { STOCK_CATEGORY, STOCK_MOVEMENT } from '../../common/constants.js';

const isoDate = z.string().datetime({ offset: true });

export const createStockItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    category: z.nativeEnum(STOCK_CATEGORY).optional(),
    warehouse: z.string().trim().max(120).optional(),
    quantity: z.number().min(0).max(1e9).optional(),
    unit: z.string().trim().max(20).optional(),
    minLevel: z.number().min(0).max(1e9).optional(),
    capacity: z.number().min(0).max(1e9).optional(),
    unitPrice: z.number().min(0).max(1e9).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export const updateStockItemSchema = createStockItemSchema.partial().strict();

export const listStockQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    category: z.nativeEnum(STOCK_CATEGORY).optional(),
    warehouse: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export const createMovementSchema = z
  .object({
    direction: z.nativeEnum(STOCK_MOVEMENT),
    amount: z.number().positive().max(1e9),
    unit: z.string().trim().max(20).optional(),
    date: isoDate.optional(),
    reason: z.string().trim().max(200).optional(),
    reference: z.string().trim().max(80).optional(),
  })
  .strict();

export const listMovementsQuerySchema = z
  .object({
    direction: z.nativeEnum(STOCK_MOVEMENT).optional(),
    days: z.coerce.number().int().min(1).max(365).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default {
  createStockItemSchema,
  updateStockItemSchema,
  listStockQuerySchema,
  createMovementSchema,
  listMovementsQuerySchema,
};
