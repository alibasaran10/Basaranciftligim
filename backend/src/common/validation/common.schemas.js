import { z } from 'zod';

/** MongoDB ObjectId (24 hex). Route param'lari icin. */
export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Gecersiz kimlik (ObjectId)');

export const idParamSchema = z.object({ id: objectId }).strict();

/** GeoJSON Polygon dogrulamasi (tarla/bolge sinirlari icin). */
export const polygonSchema = z
  .object({
    type: z.literal('Polygon'),
    // [ [ [lng, lat], ... en az 4 nokta, ilk=son ] ]
    coordinates: z
      .array(
        z
          .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
          .min(4, 'Polygon halkasi en az 4 nokta icermeli')
      )
      .min(1),
  })
  .strict();

export default { objectId, idParamSchema, polygonSchema };
