import { z } from 'zod';
import {
  ANIMAL_GENDER,
  ANIMAL_STATUS,
  LACTATION_STAGE,
  HEALTH_RECORD_TYPE,
} from '../../common/constants.js';

const isoDate = z.string().datetime({ offset: true });

export const createAnimalSchema = z
  .object({
    earTag: z.string().trim().min(1).max(40),
    name: z.string().trim().max(80).optional(),
    species: z.string().trim().max(40).optional(),
    breed: z.string().trim().max(60).optional(),
    gender: z.nativeEnum(ANIMAL_GENDER),
    birthDate: isoDate.optional(),
    status: z.nativeEnum(ANIMAL_STATUS).optional(),

    lactationStage: z.nativeEnum(LACTATION_STAGE).optional(),
    lactationNumber: z.number().int().min(0).max(20).optional(),
    weightKg: z.number().positive().max(2000).optional(),
    photoUrl: z.string().trim().max(300).optional(),
    barnSection: z.string().trim().max(120).optional(),
    sireTag: z.string().trim().max(40).optional(),
    damTag: z.string().trim().max(40).optional(),

    lastInseminationAt: isoDate.optional(),
    expectedBirthAt: isoDate.optional(),
    lastCalvingAt: isoDate.optional(),

    dailyMilkLiters: z.number().min(0).max(200).optional(),
    healthScore: z.number().min(0).max(100).optional(),
    bodyTemperature: z.number().min(30).max(45).optional(),
    ruminationMinutes: z.number().min(0).max(1440).optional(),
    activityMinutes: z.number().min(0).max(1440).optional(),
    lastVetCheckAt: isoDate.optional(),

    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

// Guncellemede tum alanlar opsiyonel; earTag degistirilebilir ama benzersizlik korunur.
export const updateAnimalSchema = createAnimalSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .strict();

/** Saglik / ureme kaydi ekleme (asi, tedavi, tohumlama...). */
export const addHealthRecordSchema = z
  .object({
    type: z.nativeEnum(HEALTH_RECORD_TYPE),
    title: z.string().trim().min(1).max(160),
    date: isoDate.optional(),
    notes: z.string().trim().max(500).optional(),
    performedBy: z.string().trim().max(120).optional(),
  })
  .strict();

/** Gunluk sut olcumu kaydi. */
export const addMilkRecordSchema = z
  .object({
    date: isoDate.optional(),
    liters: z.number().min(0).max(200),
  })
  .strict();

export const listAnimalsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    breed: z.string().trim().max(60).optional(),
    status: z.nativeEnum(ANIMAL_STATUS).optional(),
    lactationStage: z.nativeEnum(LACTATION_STAGE).optional(),
    barnSection: z.string().trim().max(120).optional(),
    sireTag: z.string().trim().max(40).optional(),
    damTag: z.string().trim().max(40).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export default {
  createAnimalSchema,
  updateAnimalSchema,
  addHealthRecordSchema,
  addMilkRecordSchema,
  listAnimalsQuerySchema,
};
