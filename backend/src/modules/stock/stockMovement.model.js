import mongoose from 'mongoose';
import { STOCK_MOVEMENT } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Stok hareketi (giris / cikis / duzeltme).
 * Stok kalemindeki "quantity" bu kayitlarla birlikte atomik olarak guncellenir;
 * boylece hem anlik miktar hizli okunur hem de tam denetim izi (audit) kalir.
 */
const stockMovementSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    item: { type: Schema.Types.ObjectId, ref: 'StockItem', required: true, index: true },

    direction: { type: String, enum: Object.values(STOCK_MOVEMENT), required: true, index: true },
    // Daima POZITIF saklanir; yon "direction" alanindadir.
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true, maxlength: 20, default: 'Ton' },

    date: { type: Date, required: true, default: () => new Date(), index: true },
    reason: { type: String, trim: true, maxlength: 200 }, // "Hasat girisi", "Yemleme"
    reference: { type: String, trim: true, maxlength: 80 }, // irsaliye / fis no
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hareket listesi: ciftlik + tarih tersine.
stockMovementSchema.index({ farm: 1, date: -1 });
// Bir urunun hareket gecmisi.
stockMovementSchema.index({ item: 1, date: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;
