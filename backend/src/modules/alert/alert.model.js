import mongoose from 'mongoose';
import {
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_STATUS,
  ALERT_SOURCE,
} from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Alarm / Uyari. Dusuk pil, anormal hareket, hastalik/kizginlik supheleri,
 * bolge disina cikma vb. Kamera tetikleme ve dashboard uyarilarinin kaynagi.
 *
 * Alarm ekranindaki kolonlar ile birebir eslesir:
 *   Alarm Turu (title/type) | Kaynak (source) | ID/Aciklama (message)
 *   Oncelik (severity) | Olusma Zamani (createdAt) | Durum (status) | Atanan (assignedLabel)
 */
const alertSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    type: { type: String, enum: Object.values(ALERT_TYPE), required: true, index: true },
    // Alarmin hangi operasyon alanindan geldigi (Suru / Tarla / Stok / Kamera...).
    source: {
      type: String,
      enum: Object.values(ALERT_SOURCE),
      default: ALERT_SOURCE.SYSTEM,
      index: true,
    },
    severity: { type: String, enum: Object.values(ALERT_SEVERITY), default: ALERT_SEVERITY.WARNING },
    status: { type: String, enum: Object.values(ALERT_STATUS), default: ALERT_STATUS.OPEN, index: true },

    // Insan-okur alarm basligi ("Kizginlik / Stres Alarmi").
    title: { type: String, trim: true, maxlength: 160 },

    animal: { type: Schema.Types.ObjectId, ref: 'Animal', index: true },
    device: { type: Schema.Types.ObjectId, ref: 'Device' },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
    camera: { type: Schema.Types.ObjectId, ref: 'Camera' },
    field: { type: Schema.Types.ObjectId, ref: 'Field' },
    stockItem: { type: Schema.Types.ObjectId, ref: 'StockItem' },

    message: { type: String, required: true, maxlength: 500 },
    context: { type: Schema.Types.Mixed }, // olcumler, esik degeri vb.

    // Alarmin atandigi kisi. Kayitli kullanici veya serbest metin ("Veteriner Hekim").
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedLabel: { type: String, trim: true, maxlength: 120 },

    // Kamera ile gorsel dogrulama yapildi mi? (alarm ekranindaki sayac)
    cameraVerified: { type: Boolean, default: false },
    // Alarm kartlarindaki onizleme gorseli.
    imageUrl: { type: String, trim: true, maxlength: 300 },

    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },

    // Ayni durumdan kisa surede tekrar tekrar alarm uretmemek icin (deduplication).
    dedupeKey: { type: String, index: true },
  },
  { timestamps: true }
);

// Dashboard: acik alarmlar en yeniden eskiye.
alertSchema.index({ farm: 1, status: 1, createdAt: -1 });
// Bir hayvanin alarm gecmisi.
alertSchema.index({ animal: 1, createdAt: -1 });
// Alarm ekranindaki kaynak sekmeleri (Suru / Tarla / Stok / Kamera).
alertSchema.index({ farm: 1, source: 1, createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
