import { z } from 'zod';
import { MOTION_STATE } from '../../common/constants.js';

/**
 * ESP32'den gelen telemetri paketinin katı dogrulamasi.
 * .strict() -> semada olmayan alanlar reddedilir (beklenmedik girdi engellenir).
 */
const macField = z
  .string()
  .trim()
  .max(20)
  .regex(/^([0-9A-Fa-f]{2}[:-]?){5}[0-9A-Fa-f]{2}$/, 'Gecersiz MAC adresi');

const accelSchema = z
  .object({
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    z: z.number().finite().optional(),
    magnitude: z.number().finite().nonnegative().optional(),
  })
  .strict();

const rssiScanSchema = z
  .object({
    bssid: macField,
    rssi: z.number().int().min(-120).max(0),
  })
  .strict();

export const ingestSchema = z
  .object({
    // deviceAuth hem "mac" hem "macAddress" kabul eder; ikisinden biri zorunlu.
    mac: macField.optional(),
    macAddress: macField.optional(),
    ts: z.string().datetime({ offset: true }).optional(),
    accel: accelSchema.optional(),
    motionState: z.nativeEnum(MOTION_STATE).optional(),
    battery: z.number().min(0).max(100).optional(),
    // Tek pakette asiri buyuk tarama listelerini sinirla (DoS'a karsi).
    rssiScans: z.array(rssiScanSchema).max(50).optional(),
  })
  .strict()
  .refine((d) => d.mac || d.macAddress, {
    message: 'mac veya macAddress zorunludur',
    path: ['mac'],
  });

/** Telemetri sorgu (cursor sayfalandirma) parametreleri. */
export const listTelemetryQuerySchema = z
  .object({
    animalId: z.string().length(24).optional(),
    deviceId: z.string().length(24).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    cursor: z.string().length(24).optional(),
    sort: z.enum(['asc', 'desc']).optional(),
  })
  .strict();

export default { ingestSchema, listTelemetryQuerySchema };
