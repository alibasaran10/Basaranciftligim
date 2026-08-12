import mongoose from 'mongoose';
import { ACCOUNT_TYPE } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Kasa / Banka hesabi. Finans genel bakistaki "Nakit Durumu" kartini besler.
 * IBAN gibi bilgiler hassastir; API'de maskeli dondurulur.
 */
const accountSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: Object.values(ACCOUNT_TYPE), required: true, index: true },
    bankName: { type: String, trim: true, maxlength: 120 },
    iban: { type: String, trim: true, maxlength: 34, select: false },
    balance: { type: Number, default: 0 },
    currency: { type: String, trim: true, maxlength: 3, default: 'TRY' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.iban;
        delete ret.__v;
        return ret;
      },
    },
  }
);

accountSchema.index({ farm: 1, name: 1 }, { unique: true });

const Account = mongoose.model('Account', accountSchema);
export default Account;
