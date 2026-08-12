import mongoose from 'mongoose';
import {
  FINANCE_TYPE,
  FINANCE_STATUS,
  PAYMENT_METHOD,
} from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Finans islemi (gelir veya gider).
 *
 * Tek koleksiyon + "type" alani kullanilir; boylece genel bakis ekranindaki
 * gelir/gider/kar hesaplari tek aggregate ile cikar ve gelir/gider listeleri
 * ayni indeksten (farm + type + date) beslenir.
 *
 * Kismi tahsilat/odeme icin "paidAmount" tutulur; kalan = amount - paidAmount.
 */
const financeTransactionSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    type: { type: String, enum: Object.values(FINANCE_TYPE), required: true, index: true },

    // Belge no ("GEL-2024-1187" / "GID-2024-1189"). Ciftlik icinde tekil.
    code: { type: String, trim: true, maxlength: 40 },
    date: { type: Date, required: true, default: () => new Date(), index: true },

    description: { type: String, required: true, trim: true, maxlength: 300 },
    // Kategori serbest metin degil, isletmenin kullandigi baslik ("Süt Satışları").
    category: { type: String, required: true, trim: true, maxlength: 120, index: true },
    // Gelirde musteri/alici, giderde tedarikci.
    counterparty: { type: String, trim: true, maxlength: 160 },

    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.BANK_TRANSFER,
    },
    account: { type: Schema.Types.ObjectId, ref: 'Account' },

    amount: { type: Number, required: true, min: 0 }, // TL
    paidAmount: { type: Number, min: 0, default: 0 }, // tahsil edilen / odenen
    status: {
      type: String,
      enum: Object.values(FINANCE_STATUS),
      default: FINANCE_STATUS.PENDING,
      index: true,
    },
    // Vadesi gelen tahsilat/odeme listeleri icin.
    dueDate: { type: Date, index: true },

    // Iliskili kayitlar (verim/maliyet raporlarini baglamak icin).
    field: { type: Schema.Types.ObjectId, ref: 'Field' },
    animal: { type: Schema.Types.ObjectId, ref: 'Animal' },
    cropRecord: { type: Schema.Types.ObjectId, ref: 'CropRecord' },

    notes: { type: String, trim: true, maxlength: 1000 },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Liste ekranlari: ciftlik + tur + tarih tersine.
financeTransactionSchema.index({ farm: 1, type: 1, date: -1 });
// Kategori dagilimi grafikleri.
financeTransactionSchema.index({ farm: 1, type: 1, category: 1 });
// Belge no tekilligi (bos olanlar haric).
financeTransactionSchema.index(
  { farm: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } }
);

const FinanceTransaction = mongoose.model('FinanceTransaction', financeTransactionSchema);
export default FinanceTransaction;
