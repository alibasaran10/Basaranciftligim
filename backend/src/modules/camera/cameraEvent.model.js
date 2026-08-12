import mongoose from 'mongoose';
import { CAMERA_EVENT_TYPE } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Kamera olayi / kaydi ("Hareket Algılandı", "Hat Dışı", "Kayıt Başlatıldı").
 * Kamera ekranindaki "Son Kayıtlar / Olaylar" panelini besler ve alarmlarin
 * gorsel dogrulamasinda referans olarak kullanilir.
 */
const cameraEventSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    camera: { type: Schema.Types.ObjectId, ref: 'Camera', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(CAMERA_EVENT_TYPE),
      default: CAMERA_EVENT_TYPE.MOTION,
      index: true,
    },
    occurredAt: { type: Date, required: true, default: () => new Date(), index: true },
    durationSeconds: { type: Number, min: 0 },
    thumbnailUrl: { type: String, trim: true, maxlength: 300 },
    clipUrl: { type: String, trim: true, maxlength: 300 },
    // Olayin tetikledigi alarm (varsa).
    alert: { type: Schema.Types.ObjectId, ref: 'Alert' },
    animal: { type: Schema.Types.ObjectId, ref: 'Animal' },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

cameraEventSchema.index({ farm: 1, occurredAt: -1 });
cameraEventSchema.index({ camera: 1, occurredAt: -1 });

const CameraEvent = mongoose.model('CameraEvent', cameraEventSchema);
export default CameraEvent;
