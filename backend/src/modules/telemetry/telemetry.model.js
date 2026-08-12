import mongoose from 'mongoose';
import { MOTION_STATE } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Telemetri / Olay (Log) verisi -- SISTEMIN EN YUKSEK HACIMLI KOLEKSIYONU.
 * ESP32'lerden akan her okuma buraya yazilir (milyarlarca satir hedefi).
 *
 * Neden MongoDB Time-Series Collection?
 *  - Zaman serisi verisini otomatik "bucket"lar; disk ve I/O ciddi azalir.
 *  - metaField (meta) uzerinden cihaz/hayvan bazli sorgular hizli olur.
 *  - expireAfterSeconds ile otomatik TTL (eski ham veriyi silme) mumkundur;
 *    ozetler (rollup) ayri koleksiyonda saklanabilir.
 *
 * ONEMLI: Time-series koleksiyonlarda benzersiz indeks ve keyfi guncelleme
 * desteklenmez; bu koleksiyon "append-only" (yalnizca ekleme) kullanilir.
 */
const rssiScanSchema = new Schema(
  {
    bssid: { type: String, required: true }, // Access Point MAC
    rssi: { type: Number, required: true }, // dBm (negatif)
  },
  { _id: false }
);

const telemetrySchema = new Schema(
  {
    // Zaman alani (time-series timeField). Cihaz gondermezse sunucu zamani.
    ts: { type: Date, required: true, default: () => new Date() },

    // metaField: dusuk-kardinaliteli, sorgu/gruplama anahtarlari.
    meta: {
      farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
      device: { type: Schema.Types.ObjectId, ref: 'Device' },
      animal: { type: Schema.Types.ObjectId, ref: 'Animal' },
      mac: { type: String, required: true },
    },

    // Sensor olcumleri.a
    accel: {
      x: { type: Number },
      y: { type: Number },
      z: { type: Number },
      magnitude: { type: Number }, // sqrt(x^2+y^2+z^2), konumlandirma/anomali icin
    },
    motionState: { type: String, enum: Object.values(MOTION_STATE), default: MOTION_STATE.UNKNOWN },
    battery: { type: Number, min: 0, max: 100 },

    // Ham RSSI taramalari (konumlandirma motorunun girdisi).
    rssiScans: { type: [rssiScanSchema], default: [] },

    // Konumlandirma motorunun ciktisi (hesaplandiktan sonra yazilir).
    detectedZone: { type: Schema.Types.ObjectId, ref: 'Zone' },
    detectedZoneRssi: { type: Number },

    // Verinin gelis kanali (denetim icin).
    ingestedVia: { type: String, enum: ['http', 'mqtt'], default: 'http' },
  },
  {
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'minutes', // ~15 dk periyot icin uygun bucket
    },
    // Ham telemetriyi 180 gun sonra otomatik sil (ozet/rollup ayri saklanir).
    // Uretim ihtiyacina gore ayarlayin; 0/undefined ise TTL uygulanmaz.
    expireAfterSeconds: 60 * 60 * 24 * 180,
    versionKey: false,
  }
);

// En sik sorgu: bir cihazin/hayvanin belirli zaman araligindaki verileri.
telemetrySchema.index({ 'meta.animal': 1, ts: -1 });
telemetrySchema.index({ 'meta.device': 1, ts: -1 });
telemetrySchema.index({ 'meta.farm': 1, ts: -1 });

const Telemetry = mongoose.model('Telemetry', telemetrySchema);
export default Telemetry;
