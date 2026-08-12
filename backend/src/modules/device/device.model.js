import mongoose from 'mongoose';
import { DEVICE_STATUS } from '../../common/constants.js';
import { normalizeMac } from '../../common/utils/mac.js';

const { Schema } = mongoose;

/**
 * Cihaz (Tasma / ESP32).
 * Mac_Adresi, Pil_Seviyesi, Atanan_Hayvan_ID.
 * apiKeyHash: cihaza ozel API anahtarinin SHA-256 ozeti (duz metin saklanmaz).
 */
const deviceSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    macAddress: {
      type: String,
      required: true,
      set: normalizeMac,
      validate: { validator: (v) => !!v, message: 'Gecersiz MAC adresi' },
    },
    label: { type: String, trim: true, maxlength: 80 }, // Insan-okur etiket
    firmwareVersion: { type: String, trim: true, maxlength: 40 },

    batteryLevel: { type: Number, min: 0, max: 100, default: 100 },
    status: { type: String, enum: Object.values(DEVICE_STATUS), default: DEVICE_STATUS.ACTIVE, index: true },

    // Atanan hayvan (bire-bir).
    assignedAnimal: { type: Schema.Types.ObjectId, ref: 'Animal', index: true },

    // Cihaza ozel API anahtari ozeti (ingestion kimlik dogrulamasi).
    apiKeyHash: { type: String, select: false },

    lastSeenAt: { type: Date, index: true },
    lastBatteryReportAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.apiKeyHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// MAC global benzersiz (cihaz kimligi).
deviceSchema.index({ macAddress: 1 }, { unique: true });
// "Pili azalan cihazlar" dashboard sorgusu.
deviceSchema.index({ farm: 1, batteryLevel: 1 });
// "Cevrimdisi cihazlar" (belirli sureden once gorulenler).
deviceSchema.index({ farm: 1, lastSeenAt: -1 });

const Device = mongoose.model('Device', deviceSchema);
export default Device;
