import mongoose from 'mongoose';
import { REPORT_CATEGORY, REPORT_FORMAT } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Olusturulmus / planlanmis rapor kaydi.
 * Raporun kendisi (PDF/Excel) nesne deposunda tutulur; burada yalnizca
 * metadata ve erisim yolu saklanir.
 */
const reportSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      enum: Object.values(REPORT_CATEGORY),
      default: REPORT_CATEGORY.SYSTEM,
      index: true,
    },
    format: { type: String, enum: Object.values(REPORT_FORMAT), default: REPORT_FORMAT.PDF },

    // Raporun kapsadigi donem.
    periodStart: { type: Date },
    periodEnd: { type: Date },

    generatedAt: { type: Date, default: () => new Date(), index: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    generatedByName: { type: String, trim: true, maxlength: 120 },

    // Otomatik gonderim planlanmis mi? ("Planlanmış Rapor" karti)
    isScheduled: { type: Boolean, default: false, index: true },
    scheduleLabel: { type: String, trim: true, maxlength: 80 }, // "Her ayın 1'i"

    // Disa aktarim sayaci ("Dışa Aktarım" karti).
    downloadCount: { type: Number, min: 0, default: 0 },
    fileUrl: { type: String, trim: true, maxlength: 300 },
    sizeBytes: { type: Number, min: 0 },
  },
  { timestamps: true }
);

reportSchema.index({ farm: 1, generatedAt: -1 });
reportSchema.index({ farm: 1, category: 1, generatedAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
