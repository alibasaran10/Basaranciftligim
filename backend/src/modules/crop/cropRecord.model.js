import mongoose from 'mongoose';
import { CROP_RECORD_TYPE, CROP_RECORD_STATUS } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Ekim & Hasat kaydi.
 *
 * Tarla uzerindeki "operations" alani gunluk saha islemlerini (suruldu,
 * ilaclandi...) tutarken; bu koleksiyon sezonluk EKIM ve HASAT kayitlarini
 * ayri ve sorgulanabilir sekilde saklar: alan, miktar, maliyet, verim.
 * Finans ve verim raporlarinin kaynagi budur.
 */
const cropRecordSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    field: { type: Schema.Types.ObjectId, ref: 'Field', required: true, index: true },

    type: { type: String, enum: Object.values(CROP_RECORD_TYPE), required: true, index: true },
    date: { type: Date, required: true, default: () => new Date(), index: true },

    crop: { type: String, required: true, trim: true, maxlength: 80 },
    variety: { type: String, trim: true, maxlength: 80 }, // cesit / hibrit

    areaDonum: { type: Number, min: 0, default: 0 },
    amount: { type: Number, min: 0, default: 0 }, // ekim/hasat miktari
    unit: { type: String, trim: true, maxlength: 20, default: 'kg/da' },
    method: { type: String, trim: true, maxlength: 60 }, // Sira Uzeri, Serpme...

    cost: { type: Number, min: 0, default: 0 }, // TL
    revenue: { type: Number, min: 0, default: 0 }, // hasatta olusan gelir
    yieldPerDonum: { type: Number, min: 0 },

    status: {
      type: String,
      enum: Object.values(CROP_RECORD_STATUS),
      default: CROP_RECORD_STATUS.PLANNED,
      index: true,
    },
    season: { type: String, trim: true, maxlength: 20 }, // orn: "2024"
    notes: { type: String, trim: true, maxlength: 1000 },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Liste ekrani: ciftlik + tur + tarihe gore ters siralama.
cropRecordSchema.index({ farm: 1, type: 1, date: -1 });
// Tarla detayindaki kayit gecmisi.
cropRecordSchema.index({ field: 1, date: -1 });

const CropRecord = mongoose.model('CropRecord', cropRecordSchema);
export default CropRecord;
