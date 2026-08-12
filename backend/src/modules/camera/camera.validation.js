import { z } from 'zod';
import { objectId } from '../../common/validation/common.schemas.js';
import { CAMERA_EVENT_TYPE } from '../../common/constants.js';

const ipv4 = z
  .string()
  .trim()
  .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Gecersiz IPv4 adresi')
  .refine(
    (v) => v.split('.').every((o) => Number(o) >= 0 && Number(o) <= 255),
    'IPv4 oktetleri 0-255 araliginda olmali'
  );

const macField = z
  .string()
  .trim()
  .regex(/^([0-9A-Fa-f]{2}[:-]?){5}[0-9A-Fa-f]{2}$/, 'Gecersiz MAC adresi');

export const createCameraSchema = z
  .object({
    zone: objectId,
    name: z.string().trim().min(1).max(120),
    ipAddress: ipv4,
    // Kimlik bilgisi ICERMEYEN yol; host icin __HOST__ yer tutucu onerilir.
    rtspPath: z.string().trim().max(300).optional(),
    routerMac: macField.optional(),
    group: z.string().trim().max(80).optional(),
    location: z.string().trim().max(160).optional(),
    snapshotUrl: z.string().trim().max(300).optional(),
    isRecording: z.boolean().optional(),
  })
  .strict();

export const updateCameraSchema = createCameraSchema.partial().strict();

export const listCameraEventsQuerySchema = z
  .object({
    camera: objectId.optional(),
    type: z.nativeEnum(CAMERA_EVENT_TYPE).optional(),
    days: z.coerce.number().int().min(1).max(365).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default { createCameraSchema, updateCameraSchema, listCameraEventsQuerySchema };
