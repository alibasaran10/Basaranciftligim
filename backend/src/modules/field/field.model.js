import mongoose from 'mongoose';
import { FIELD_OPERATION, IRRIGATION_STATUS } from '../../common/constants.js';
import { slugifyTr } from '../../common/utils/slug.js';

const { Schema } = mongoose;

/**
 * Tarla. Uydu haritasi uzerinde cizilen GeoJSON Polygon ile tanimlanir.
 * Uzerine yapilan islemler (suruldu/bicildi/hasat/balya vb.) ve verim
 * kayitlari tutulur.
 */
const operationSchema = new Schema(
  {
    type: { type: String, enum: Object.values(FIELD_OPERATION), required: true },
    date: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: 500 },
    // Serbest sekilli verim/olcum: { baleCount: 120, tonPerHectare: 3.4, ... }
    metrics: { type: Schema.Types.Mixed },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true, timestamps: true }
);

const fieldSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, trim: true, maxlength: 40 }, // parsel no, orn: "Parsel 12A"
    crop: { type: String, trim: true, maxlength: 80 }, // ekili urun
    cropVariety: { type: String, trim: true, maxlength: 80 }, // cesit / hibrit
    soilType: { type: String, trim: true, maxlength: 80 }, // Killi Tinli, Kumlu...

    // Uydu uzerinde cizilen alan (GeoJSON Polygon: [ [ [lng,lat], ... ] ]).
    boundary: {
      type: { type: String, enum: ['Polygon'], required: true },
      coordinates: { type: [[[Number]]], required: true },
    },
    areaHectares: { type: Number, min: 0 }, // sunucu tarafinda hesaplanabilir
    // Turkiye'de yaygin birim: 1 donum = 1000 m2 = 0.1 hektar.
    areaDonum: { type: Number, min: 0 },

    // --- Sulama ---
    irrigation: {
      method: { type: String, trim: true, maxlength: 60 }, // Damlama, Yagmurlama...
      status: {
        type: String,
        enum: Object.values(IRRIGATION_STATUS),
        default: IRRIGATION_STATUS.NONE,
      },
      moisturePercent: { type: Number, min: 0, max: 100 },
      lastIrrigatedAt: { type: Date },
    },

    // --- Ekim / hasat takvimi (liste ekranindaki kolonlar) ---
    growthStage: { type: String, trim: true, maxlength: 80 }, // Ciceklenme, Basaklanma...
    sowingDate: { type: Date },
    expectedHarvestDate: { type: Date },

    // --- Arazi ozellikleri (tarla detay ekrani) ---
    altitudeMeters: { type: Number, min: 0 },
    slopePercent: { type: Number, min: 0, max: 100 },
    locality: { type: String, trim: true, maxlength: 160 }, // koy / mevki
    imageUrl: { type: String, trim: true, maxlength: 300 },

    // --- Verim hedefi / gerceklesme (verim ozeti karti) ---
    expectedYieldPerDonum: { type: Number, min: 0 },
    actualYieldPerDonum: { type: Number, min: 0 },
    yieldUnit: { type: String, trim: true, maxlength: 20, default: 'Ton' },

    notes: { type: String, trim: true, maxlength: 1000 },
    operations: { type: [operationSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

fieldSchema.index({ farm: 1, name: 1 }, { unique: true });
// Cografi sorgular (bir noktayi iceren tarla vb.).
fieldSchema.index({ boundary: '2dsphere' });
// "Hasada yakin tarlalar" ve urun bazli filtreler.
fieldSchema.index({ farm: 1, expectedHarvestDate: 1 });
fieldSchema.index({ farm: 1, crop: 1 });

// URL'de kullanilabilir slug (orn: "Kuzey Tarlasi" -> "kuzey-tarlasi").
fieldSchema.virtual('slug').get(function slug() {
  return slugifyTr(this.name);
});

fieldSchema.set('toJSON', { virtuals: true });
fieldSchema.set('toObject', { virtuals: true });

const Field = mongoose.model('Field', fieldSchema);
export default Field;
