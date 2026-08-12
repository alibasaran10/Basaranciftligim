import { z } from 'zod';
import { DEVICE_STATUS } from '../../common/constants.js';
import { objectId } from '../../common/validation/common.schemas.js';

const macField = z
  .string()
  .trim()
  .regex(/^([0-9A-Fa-f]{2}[:-]?){5}[0-9A-Fa-f]{2}$/, 'Gecersiz MAC adresi');

export const createDeviceSchema = z
  .object({
    macAddress: macField,
    label: z.string().trim().max(80).optional(),
    firmwareVersion: z.string().trim().max(40).optional(),
    status: z.nativeEnum(DEVICE_STATUS).optional(),
  })
  .strict();

export const updateDeviceSchema = z
  .object({
    label: z.string().trim().max(80).optional(),
    firmwareVersion: z.string().trim().max(40).optional(),
    status: z.nativeEnum(DEVICE_STATUS).optional(),
  })
  .strict();

export const assignSchema = z
  .object({
    animalId: objectId.nullable(), // null -> atamayi kaldir
  })
  .strict();

export default { createDeviceSchema, updateDeviceSchema, assignSchema };
