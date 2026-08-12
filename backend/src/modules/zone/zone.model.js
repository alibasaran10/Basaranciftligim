import mongoose from 'mongoose';
import { normalizeMac } from '../../common/utils/mac.js';

const { Schema } = mongoose;

/**
 * Bolge (Kuzey Yemligi, Saginhane, Mera vb.).
 * Konumlandirma motoru, tasmalardan gelen RSSI taramalarini bu bolgelerin
 * "routerMacs" (Access Point MAC) listeleriyle esleyerek hayvanin nerede
 * oldugunu belirler. Bir bolgede birden fazla AP olabilir.
 */
const zoneSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    // Bu bolgeyi tanimlayan Access Point / router MAC adresleri (BSSID).
    routerMacs: {
      type: [String],
      default: [],
      set: (arr) => (Array.isArray(arr) ? arr.map(normalizeMac).filter(Boolean) : []),
    },
    // Bolgenin krokideki cografi siniri (opsiyonel GeoJSON Polygon).
    boundary: {
      type: { type: String, enum: ['Polygon'], default: undefined },
      coordinates: { type: [[[Number]]], default: undefined },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ciftlik icinde bolge adi benzersiz.
zoneSchema.index({ farm: 1, name: 1 }, { unique: true });
// Konumlandirma motorunun sik yaptigi sorgu: MAC -> bolge.
zoneSchema.index({ farm: 1, routerMacs: 1 });

const Zone = mongoose.model('Zone', zoneSchema);
export default Zone;
