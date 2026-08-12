import mongoose from 'mongoose';
import { FINANCE_TYPE } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Butce kalemi (kategori bazli yillik plan).
 * "Butce Durumu" panelindeki doluluk cubuklari, gerceklesen harcamanin
 * planlanan tutara oranindan hesaplanir; gerceklesen tutar FinanceTransaction
 * toplamindan gelir, burada saklanmaz (tek gerceklik kaynagi).
 */
const budgetSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    type: { type: String, enum: Object.values(FINANCE_TYPE), default: FINANCE_TYPE.EXPENSE },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    year: { type: Number, required: true, min: 2000, max: 2200 },
    plannedAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

budgetSchema.index({ farm: 1, year: 1, category: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
