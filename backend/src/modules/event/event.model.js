import mongoose from 'mongoose';
import { EVENT_TYPE, EVENT_STATUS, ALERT_SEVERITY } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Takvim etkinligi (dogum, tohumlama, veteriner, asi, hasat, sulama...).
 *
 * Ay gorunumu "startAt" uzerinden gun gun gruplanir; bu yuzden
 * (farm + startAt) bilesik indeksi ay araligi sorgusunu tek taramada karsilar.
 */
const eventSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, enum: Object.values(EVENT_TYPE), default: EVENT_TYPE.OTHER, index: true },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.PLANNED,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ALERT_SEVERITY),
      default: ALERT_SEVERITY.MEDIUM,
    },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date },
    allDay: { type: Boolean, default: false },

    location: { type: String, trim: true, maxlength: 160 }, // "Ahır 1", "Kuzey Tarlası"
    description: { type: String, trim: true, maxlength: 1000 },

    // Sorumlu kisi: kayitli kullanici veya serbest metin ("Dr. Ayşe Yılmaz").
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedLabel: { type: String, trim: true, maxlength: 120 },

    animal: { type: Schema.Types.ObjectId, ref: 'Animal' },
    field: { type: Schema.Types.ObjectId, ref: 'Field' },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Ay/hafta gorunumu icin tarih araligi sorgusu.
eventSchema.index({ farm: 1, startAt: 1 });
// Tur bazli sayaclar.
eventSchema.index({ farm: 1, type: 1, startAt: 1 });

const CalendarEvent = mongoose.model('CalendarEvent', eventSchema);
export default CalendarEvent;
