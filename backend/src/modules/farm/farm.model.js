import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Abonelik bilgisi. Limitler paket tanimindan gelir; KULLANIM degerleri
 * saklanmaz, ilgili koleksiyonlardan anlik sayilarak dondurulur (tek gerceklik
 * kaynagi ve senkron kalma sorunu olmamasi icin).
 */
const subscriptionSchema = new Schema(
  {
    plan: { type: String, trim: true, maxlength: 60, default: 'PROFESYONEL' },
    startedAt: { type: Date, default: () => new Date() },
    renewalAt: { type: Date },
    limits: {
      animals: { type: Number, min: 0, default: 100 },
      fields: { type: Number, min: 0, default: 20 },
      cameras: { type: Number, min: 0, default: 10 },
      storageGb: { type: Number, min: 0, default: 100 },
      users: { type: Number, min: 0, default: 10 },
    },
    storageUsedGb: { type: Number, min: 0, default: 0 },
    // Faturalandirma (abonelik ekranindaki "Fatura Bilgileri" karti).
    annualPrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, maxlength: 3, default: 'TRY' },
    lastInvoiceAt: { type: Date },
    // Pakete dahil ozellikler listesi.
    features: { type: [String], default: [] },
  },
  { _id: false }
);

/** Ayarlar ekranindaki acik/kapali anahtarlar. */
const preferencesSchema = new Schema(
  {
    notifications: { type: Boolean, default: true },
    cameraIntegration: { type: Boolean, default: true },
    deviceSettings: { type: Boolean, default: true },
    dataSync: { type: Boolean, default: true },
    security: { type: Boolean, default: true },
    apiIntegrations: { type: Boolean, default: false },
    // Bildirim kanallari.
    pushEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Ciftlik (tenant). Cok-kiracili (multi-tenant) yapinin koku.
 * Tum diger kayitlar (hayvan, cihaz, bolge, tarla...) bir ciftlige baglidir.
 * Boylece veriler kiracilara gore izole edilir ve sorgular farm ile filtrelenir.
 */
const farmSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Ciftlik merkez konumu (GeoJSON Point: [boylam, enlem]).
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    address: { type: String, trim: true, maxlength: 300 },
    timezone: { type: String, default: 'Europe/Istanbul' },

    // --- Isletme bilgileri (Ayarlar / Isletme Bilgileri formu) ---
    businessType: { type: String, trim: true, maxlength: 120 }, // "Büyükbaş Hayvancılık"
    taxNumber: { type: String, trim: true, maxlength: 20 },
    phone: { type: String, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    logoUrl: { type: String, trim: true, maxlength: 300 },
    mapImageUrl: { type: String, trim: true, maxlength: 300 },

    subscription: { type: subscriptionSchema, default: () => ({}) },
    preferences: { type: preferencesSchema, default: () => ({}) },

    /**
     * Son hava durumu anlik goruntusu. Harici hava servisinden periyodik
     * olarak yazilir; okuma tarafinda ek istek/gecikme olmasin diye ciftlik
     * uzerinde denormalize tutulur.
     */
    weather: {
      temperature: { type: Number },
      condition: { type: String, trim: true, maxlength: 60 },
      humidity: { type: Number, min: 0, max: 100 },
      windKph: { type: Number, min: 0 },
      updatedAt: { type: Date },
    },

    // Guvenlik ozeti karti.
    twoFactorEnabled: { type: Boolean, default: true },
    lastPasswordChangeAt: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Cografi sorgular icin (yakindaki ciftlikler vb.).
farmSchema.index({ location: '2dsphere' });

const Farm = mongoose.model('Farm', farmSchema);
export default Farm;
