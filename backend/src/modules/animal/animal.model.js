import mongoose from 'mongoose';
import {
  ANIMAL_GENDER,
  ANIMAL_STATUS,
  MOTION_STATE,
  LACTATION_STAGE,
  HEALTH_RECORD_TYPE,
} from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Saglik / ureme gecmisi kaydi (asi, tedavi, tohumlama, gebelik kontrolu...).
 * Hayvan detay ekranindaki "Asi / Tedavi Gecmisi" ve "Biyolojik Takvim"
 * bolumlerini besler.
 */
const healthRecordSchema = new Schema(
  {
    type: { type: String, enum: Object.values(HEALTH_RECORD_TYPE), required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    date: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: 500 },
    performedBy: { type: String, trim: true, maxlength: 120 }, // veteriner adi
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
);

/** Gunluk sut olcumu (laktasyon trendi grafigi icin). */
const milkRecordSchema = new Schema(
  {
    date: { type: Date, required: true },
    liters: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * Hayvan (Hayvan_ID, Kupe Numarasi, Yas, Cinsiyet vb.).
 * Anlik durum alanlari (currentZone, lastMotionState, lastSeenAt) telemetri
 * geldikce guncellenir; boylece dashboard tek sorguda son durumu okur
 * (tarihsel veriyi taramaya gerek kalmadan).
 */
const animalSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    earTag: { type: String, required: true, trim: true, maxlength: 40 }, // Kupe numarasi
    name: { type: String, trim: true, maxlength: 80 },
    species: { type: String, trim: true, default: 'sigir', maxlength: 40 },
    breed: { type: String, trim: true, maxlength: 60 }, // Irk
    gender: { type: String, enum: Object.values(ANIMAL_GENDER), required: true },
    birthDate: { type: Date },
    status: { type: String, enum: Object.values(ANIMAL_STATUS), default: ANIMAL_STATUS.HEALTHY, index: true },

    // --- Suru yonetimi (uretim) alanlari ---
    lactationStage: {
      type: String,
      enum: Object.values(LACTATION_STAGE),
      default: LACTATION_STAGE.HEIFER,
      index: true,
    },
    lactationNumber: { type: Number, min: 0, default: 0 }, // kacinci laktasyon
    weightKg: { type: Number, min: 0 },
    photoUrl: { type: String, trim: true, maxlength: 300 },
    // Ahir / bolum bilgisi (bolge kaydindan bagimsiz, insan-okur yerlesim).
    barnSection: { type: String, trim: true, maxlength: 120 },

    // Soy bilgisi. Kupe numarasi olarak tutulur; hayvan kaydi silinse bile
    // secere bilgisi kaybolmaz (referans yerine deger saklanir).
    sireTag: { type: String, trim: true, maxlength: 40 }, // baba
    damTag: { type: String, trim: true, maxlength: 40 }, // anne

    // --- Ureme takvimi ---
    lastInseminationAt: { type: Date },
    expectedBirthAt: { type: Date, index: true },
    lastCalvingAt: { type: Date },

    // --- Uretim & saglik gostergeleri (son olcum, denormalize) ---
    dailyMilkLiters: { type: Number, min: 0, default: 0 },
    healthScore: { type: Number, min: 0, max: 100, default: 100 },
    bodyTemperature: { type: Number, min: 30, max: 45 },
    ruminationMinutes: { type: Number, min: 0 },
    activityMinutes: { type: Number, min: 0 },
    lastVetCheckAt: { type: Date },

    healthRecords: { type: [healthRecordSchema], default: [] },
    milkRecords: { type: [milkRecordSchema], default: [] },

    // Atanmis tasma (bire-bir). Cihaz tarafinda da assignedAnimal tutulur.
    device: { type: Schema.Types.ObjectId, ref: 'Device', index: true },

    // --- Anlik (denormalize) durum: hizli dashboard sorgulari icin ---
    currentZone: { type: Schema.Types.ObjectId, ref: 'Zone', index: true },
    lastMotionState: { type: String, enum: Object.values(MOTION_STATE), default: MOTION_STATE.UNKNOWN },
    lastSeenAt: { type: Date, index: true },

    notes: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ciftlik icinde kupe numarasi benzersiz.
animalSchema.index({ farm: 1, earTag: 1 }, { unique: true });
// Dashboard: "bir bolgedeki aktif hayvanlar" gibi filtreler.
animalSchema.index({ farm: 1, currentZone: 1, status: 1 });
// Listeleme + sayfalandirma (en son gorulen sirasi).
animalSchema.index({ farm: 1, lastSeenAt: -1 });
// Suru kirilimi (sagmal/kuru/buzagi sayaclari).
animalSchema.index({ farm: 1, lactationStage: 1, isActive: 1 });
// "Yaklasan dogumlar" listesi.
animalSchema.index({ farm: 1, expectedBirthAt: 1 });

// Yasi dogum tarihinden hesapla (sanal alan).
animalSchema.virtual('ageMonths').get(function ageMonths() {
  if (!this.birthDate) return null;
  const ms = Date.now() - this.birthDate.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
});

animalSchema.set('toJSON', { virtuals: true });

const Animal = mongoose.model('Animal', animalSchema);
export default Animal;
