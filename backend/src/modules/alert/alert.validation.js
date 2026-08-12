import { z } from 'zod';
import {
  ALERT_STATUS,
  ALERT_TYPE,
  ALERT_SOURCE,
  ALERT_SEVERITY,
} from '../../common/constants.js';

export const listAlertsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    status: z.nativeEnum(ALERT_STATUS).optional(),
    type: z.nativeEnum(ALERT_TYPE).optional(),
    source: z.nativeEnum(ALERT_SOURCE).optional(),
    severity: z.nativeEnum(ALERT_SEVERITY).optional(),
    // Son N gun (alarm ekranindaki "Son 7 Gun" filtresi).
    days: z.coerce.number().int().min(1).max(365).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default { listAlertsQuerySchema };
