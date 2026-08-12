import { z } from 'zod';
import { REPORT_CATEGORY, REPORT_FORMAT } from '../../common/constants.js';

const isoDate = z.string().datetime({ offset: true });

export const createReportSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    category: z.nativeEnum(REPORT_CATEGORY),
    format: z.nativeEnum(REPORT_FORMAT).optional(),
    periodStart: isoDate.optional(),
    periodEnd: isoDate.optional(),
    isScheduled: z.boolean().optional(),
    scheduleLabel: z.string().trim().max(80).optional(),
  })
  .strict();

export const listReportsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    category: z.nativeEnum(REPORT_CATEGORY).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default { createReportSchema, listReportsQuerySchema };
