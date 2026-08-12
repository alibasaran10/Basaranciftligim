import { z } from 'zod';
import { EVENT_TYPE, EVENT_STATUS, ALERT_SEVERITY } from '../../common/constants.js';
import { objectId } from '../../common/validation/common.schemas.js';

const isoDate = z.string().datetime({ offset: true });

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    type: z.nativeEnum(EVENT_TYPE).optional(),
    status: z.nativeEnum(EVENT_STATUS).optional(),
    priority: z.nativeEnum(ALERT_SEVERITY).optional(),
    startAt: isoDate,
    endAt: isoDate.optional(),
    allDay: z.boolean().optional(),
    location: z.string().trim().max(160).optional(),
    description: z.string().trim().max(1000).optional(),
    assignedTo: objectId.optional(),
    assignedLabel: z.string().trim().max(120).optional(),
    animal: objectId.optional(),
    field: objectId.optional(),
  })
  .strict();

export const updateEventSchema = createEventSchema.partial().strict();

export const listEventsQuerySchema = z
  .object({
    // Ay gorunumu: ?year=2026&month=7 (1-12)
    year: z.coerce.number().int().min(2000).max(2200).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    type: z.nativeEnum(EVENT_TYPE).optional(),
    status: z.nativeEnum(EVENT_STATUS).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
  })
  .strict();

export const summaryQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2200).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .strict();

export default {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  summaryQuerySchema,
};
