import mongoose from 'mongoose';
import { CAMERA_SOURCE } from '../../common/constants.js';

const { Schema } = mongoose;

/**
 * Kamera. Her kamera bir bolgeye baglidir.
 * Anormal olay tespitinde, hayvanin bulundugu bolgenin kamerasi eslenerek
 * frontend'e "su kamerayi ac" komutu gonderilir.
 *
 * GORUNTU AKISI: Goruntu, sahadaki Raspberry Pi ajaninin DISARI DOGRU actigi
 * WebSocket uzerinden gelir (bkz. realtime/cameraIngest.js). Pi'nin internete
 * cikabilmesi yeterlidir; sabit IP, port yonlendirme veya VPN gerekmez ---
 * kamera konum farketmeksizin calisir. Bu nedenle "ipAddress" artik zorunlu
 * degildir; yalnizca yerel agdaki IP kameralar icin anlamlidir.
 *
 * GUVENLIK: RTSP kimlik bilgileri (kullanici/parola) DB'de duz metin
 * tutulmamali; burada URL'yi kimliksiz saklariz, kimlik bilgileri ayri ve
 * sifreli (veya secret manager'da) tutulmalidir. Ajan anahtari da duz metin
 * degil SHA-256 ozet olarak saklanir (streamKeyHash, select:false).
 */
const cameraSchema = new Schema(
  {
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    // Yalnizca yerel agdaki IP kameralar icin; Pi ajanli kameralarda bos kalir.
    ipAddress: {
      type: String,
      trim: true,
      match: [/^(\d{1,3}\.){3}\d{1,3}$/, 'Gecersiz IPv4 adresi'],
    },
    // Kimlik bilgisi ICERMEYEN RTSP yolu; orn: "rtsp://__HOST__:554/stream1"
    rtspPath: { type: String, trim: true, maxlength: 300 },
    // Router eslemesi icin (DHCP rezervasyonu ile statik IP saglanir).
    routerMac: { type: String, trim: true },

    // --- Canli izleme ekrani alanlari ---
    // Kamera grubu ("Ahırlar", "Tarlalar", "Depolar", "Makine Parkı").
    group: { type: String, trim: true, maxlength: 80, index: true },
    location: { type: String, trim: true, maxlength: 160 },
    // Onizleme karesi (poster). Canli akis ayri kopruden gelir.
    snapshotUrl: { type: String, trim: true, maxlength: 300 },
    isRecording: { type: Boolean, default: true },
    lastFrameAt: { type: Date },

    // --- Saha ajani (Raspberry Pi) baglantisi ---
    // Ajanin kimligini dogruladigi anahtarin SHA-256 ozeti. Duz anahtar
    // yalnizca olusturulma aninda bir kez gosterilir, DB'de tutulmaz.
    streamKeyHash: { type: String, select: false },
    // Ajanin hangi yakalama yolunu kullanacagi.
    source: {
      type: String,
      enum: Object.values(CAMERA_SOURCE),
      default: CAMERA_SOURCE.USB,
    },
    // USB icin /dev/videoN indeksi, CSI icin kamera numarasi.
    sourceIndex: { type: Number, default: 0, min: 0, max: 31 },
    // Ajanin hedefleyecegi yakalama ayarlari.
    captureWidth: { type: Number, default: 1280, min: 160, max: 3840 },
    captureHeight: { type: Number, default: 720, min: 120, max: 2160 },
    captureFps: { type: Number, default: 12, min: 1, max: 30 },
    jpegQuality: { type: Number, default: 70, min: 20, max: 95 },
    // Ajanin kendini tanittigi bilgiler (Pi modeli, ajan surumu).
    agentModel: { type: String, trim: true, maxlength: 120 },
    agentVersion: { type: String, trim: true, maxlength: 40 },
    agentConnectedAt: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ipAddress artik opsiyonel; sparse olmadan birden fazla kamera "null" IP ile
// benzersizlik kisitini ihlal ederdi.
cameraSchema.index({ farm: 1, ipAddress: 1 }, { unique: true, sparse: true });
cameraSchema.index({ zone: 1, isActive: 1 });
cameraSchema.index({ farm: 1, group: 1 });
// Ajan her baglandiginda anahtar ozetinden kamerayi bulur; tarama yapilmamali.
cameraSchema.index({ streamKeyHash: 1 }, { sparse: true });

const Camera = mongoose.model('Camera', cameraSchema);
export default Camera;
