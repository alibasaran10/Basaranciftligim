import mongoose from 'mongoose';
import { STOCK_CATEGORY, STOCK_LEVEL } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Stok kalemi (Yonca, Silajlik Misir, Saman, Bugday...).
 *
 * Miktar (quantity) hareketlerden (StockMovement) turetilebilir; ancak liste
 * ekrani her satirda toplam hesaplamasin diye burada DENORMALIZE tutulur ve
 * her hareket kaydinda atomik olarak ($inc) guncellenir.
 */
const stockItemSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: Object.values(STOCK_CATEGORY),
      default: STOCK_CATEGORY.OTHER,
      index: true,
    },
    // Depo / silo adi ("Silo 1", "Tahil Ambari", "Kuru Ot Alani").
    warehouse: { type: String, trim: true, maxlength: 120, index: true },

    quantity: { type: Number, min: 0, default: 0 }, // mevcut miktar
    unit: { type: String, trim: true, maxlength: 20, default: 'Ton' },
    minLevel: { type: Number, min: 0, default: 0 }, // kritik esik
    capacity: { type: Number, min: 0 }, // silo kapasitesi (doluluk yuzdesi icin)

    unitPrice: { type: Number, min: 0, default: 0 }, // TL / birim (deger raporu)

    // Son hareket ozetleri (liste ekranindaki "Son Giris"/"Son Cikis" kolonlari).
    lastInAmount: { type: Number, default: 0 },
    lastInAt: { type: Date },
    lastOutAmount: { type: Number, default: 0 },
    lastOutAt: { type: Date },

    notes: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Ciftlik icinde ayni depoda ayni urun tekil.
stockItemSchema.index({ farm: 1, name: 1, warehouse: 1 }, { unique: true });
// "Kritik stoklar" sorgusu.
stockItemSchema.index({ farm: 1, quantity: 1 });

/**
 * Durum, miktarin minimum seviyeye oranindan turetilir:
 *   >= %100 yeterli | >= %60 orta | altinda kritik.
 * minLevel tanimli degilse her zaman "yeterli" kabul edilir.
 */
stockItemSchema.virtual('level').get(function level() {
  const min = Number(this.minLevel) || 0;
  if (min <= 0) return STOCK_LEVEL.SUFFICIENT;
  const ratio = Number(this.quantity) / min;
  if (ratio >= 1) return STOCK_LEVEL.SUFFICIENT;
  if (ratio >= 0.6) return STOCK_LEVEL.MEDIUM;
  return STOCK_LEVEL.CRITICAL;
});

/** Silo doluluk yuzdesi (kapasite tanimliysa). */
stockItemSchema.virtual('fillPercent').get(function fillPercent() {
  const cap = Number(this.capacity) || 0;
  if (!cap) return null;
  return Math.min(100, Math.round((Number(this.quantity) / cap) * 100));
});

const StockItem = mongoose.model('StockItem', stockItemSchema);
export default StockItem;
