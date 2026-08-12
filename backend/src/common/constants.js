/**
 * Uygulama genelinde paylasilan sabitler / enum degerleri.
 * Tek kaynak: modeller, validasyon ve is mantigi ayni degerleri kullanir.
 */

export const ROLES = Object.freeze({
  ADMIN: 'admin', // tam yetki
  FARMER: 'farmer', // ciftlik yoneticisi
  VIEWER: 'viewer', // salt-okunur
});

export const ROLE_VALUES = Object.values(ROLES);

export const ANIMAL_GENDER = Object.freeze({
  MALE: 'erkek',
  FEMALE: 'disi',
});

export const ANIMAL_STATUS = Object.freeze({
  HEALTHY: 'saglikli',
  SICK: 'hasta',
  ESTRUS: 'kizginlik', // kizginlik (ureme)
  PREGNANT: 'gebe',
  SOLD: 'satildi',
  DECEASED: 'olu',
});

export const MOTION_STATE = Object.freeze({
  ACTIVE: 'aktif',
  LYING: 'yatiyor',
  RUNNING: 'kosuyor',
  GRAZING: 'otluyor',
  UNKNOWN: 'bilinmiyor',
});

export const DEVICE_STATUS = Object.freeze({
  ACTIVE: 'aktif',
  INACTIVE: 'pasif',
  LOST: 'kayip',
  MAINTENANCE: 'bakimda',
});

export const ALERT_TYPE = Object.freeze({
  LOW_BATTERY: 'dusuk_pil',
  ABNORMAL_MOTION: 'anormal_hareket',
  DISEASE: 'hastalik',
  ESTRUS: 'kizginlik',
  ZONE_LEFT: 'bolge_disina_cikti',
  DEVICE_OFFLINE: 'cihaz_cevrimdisi',
  // Operasyonel alarmlar (tarla/stok/kamera/takvim kaynakli).
  BIRTH_APPROACHING: 'dogum_yaklasiyor',
  TEMPERATURE: 'sicaklik_uyarisi',
  IRRIGATION: 'sulama_uyarisi',
  CRITICAL_STOCK: 'kritik_stok',
  CAMERA_OFFLINE: 'kamera_baglanti',
  VACCINATION_DUE: 'asilama_hatirlatma',
});

/**
 * Alarm onceligi. INFO/WARNING eski kayitlarla uyumluluk icin korunur;
 * yeni alarmlar dort kademeli (kritik/yuksek/orta/dusuk) olcegi kullanir.
 */
export const ALERT_SEVERITY = Object.freeze({
  INFO: 'bilgi',
  WARNING: 'uyari',
  LOW: 'dusuk',
  MEDIUM: 'orta',
  HIGH: 'yuksek',
  CRITICAL: 'kritik',
});

/** Alarmin hangi operasyon alanindan geldigi (alarm ekranindaki sekmeler). */
export const ALERT_SOURCE = Object.freeze({
  HERD: 'suru',
  FIELD: 'tarla',
  STOCK: 'stok',
  CAMERA: 'kamera',
  DEVICE: 'cihaz',
  SYSTEM: 'sistem',
});

export const ALERT_STATUS = Object.freeze({
  OPEN: 'acik',
  ACKNOWLEDGED: 'goruldu',
  RESOLVED: 'cozuldu',
});

export const FIELD_OPERATION = Object.freeze({
  PLOWED: 'suruldu',
  SOWN: 'ekildi',
  MOWED: 'bicildi',
  HARVESTED: 'hasat_edildi',
  BALED: 'balyalandi',
  FERTILIZED: 'gubrelendi',
  SPRAYED: 'ilaclandi',
  IRRIGATED: 'sulandi',
});

/**
 * Suru yonetimindeki uretim durumu (laktasyon). ANIMAL_STATUS saglik/ureme
 * durumunu tutarken bu alan "sagmal/kuru/buzagi" kirilimini verir.
 */
export const LACTATION_STAGE = Object.freeze({
  MILKING: 'sagmal',
  DRY: 'kuru',
  CALF: 'buzagi',
  HEIFER: 'genc',
  BEEF: 'besi',
});

/** Hayvan saglik kaydi turleri (asi/tedavi gecmisi). */
export const HEALTH_RECORD_TYPE = Object.freeze({
  VACCINE: 'asi',
  TREATMENT: 'tedavi',
  CHECKUP: 'kontrol',
  INSEMINATION: 'tohumlama',
  BIRTH: 'dogum',
  PREGNANCY_CHECK: 'gebelik_kontrolu',
  DRY_OFF: 'kuruya_ayirma',
});

/** Tarla sulama durumu (tarla listesindeki "Sulama" kolonu). */
export const IRRIGATION_STATUS = Object.freeze({
  GOOD: 'iyi',
  MEDIUM: 'orta',
  POOR: 'kotu',
  NONE: 'planlanmadi',
});

/** Stok kategorileri. */
export const STOCK_CATEGORY = Object.freeze({
  FEED_CROP: 'yem_bitkisi',
  SILAGE: 'silaj',
  HAY: 'kuru_ot',
  GRAIN: 'tahil',
  CONCENTRATE: 'yem',
  FERTILIZER: 'gubre',
  SEED: 'tohum',
  MEDICINE: 'ilac',
  FUEL: 'yakit',
  OTHER: 'diger',
});

/** Stok hareketi yonu. */
export const STOCK_MOVEMENT = Object.freeze({
  IN: 'giris',
  OUT: 'cikis',
  ADJUSTMENT: 'duzeltme',
});

/** Stok seviyesi durumu (miktar / minimum seviye oranindan turetilir). */
export const STOCK_LEVEL = Object.freeze({
  SUFFICIENT: 'yeterli',
  MEDIUM: 'orta',
  CRITICAL: 'kritik',
});

/** Finans islem yonu. */
export const FINANCE_TYPE = Object.freeze({
  INCOME: 'gelir',
  EXPENSE: 'gider',
});

/**
 * Finans islem durumu. Arayuzde gelir icin "Tahsil Edildi / Kismi Tahsil",
 * gider icin "Odendi / Kismi Odendi" olarak etiketlenir.
 */
export const FINANCE_STATUS = Object.freeze({
  COMPLETED: 'tamamlandi',
  PARTIAL: 'kismi',
  PENDING: 'beklemede',
});

/** Odeme yontemi. */
export const PAYMENT_METHOD = Object.freeze({
  BANK_TRANSFER: 'banka_havalesi',
  EFT: 'eft',
  WIRE: 'havale',
  CASH: 'nakit',
  CREDIT_CARD: 'kredi_karti',
  CHECK: 'cek',
});

/** Kasa/banka hesap turu. */
export const ACCOUNT_TYPE = Object.freeze({
  CASH: 'kasa',
  BANK: 'banka',
});

/** Ekim & hasat kayit turu. */
export const CROP_RECORD_TYPE = Object.freeze({
  SOWING: 'ekim',
  HARVEST: 'hasat',
});

/** Ekim/hasat kaydi durumu. */
export const CROP_RECORD_STATUS = Object.freeze({
  PLANNED: 'planlandi',
  IN_PROGRESS: 'devam_ediyor',
  COMPLETED: 'tamamlandi',
});

/** Takvim etkinlik turleri. */
export const EVENT_TYPE = Object.freeze({
  BIRTH: 'dogum',
  INSEMINATION: 'tohumlama',
  VETERINARY: 'veteriner',
  VACCINE: 'asi',
  HARVEST: 'hasat',
  IRRIGATION: 'sulama',
  FERTILIZING: 'gubreleme',
  STOCK_COUNT: 'stok_sayimi',
  MAINTENANCE: 'bakim',
  CAMERA_CHECK: 'kamera_kontrolu',
  OTHER: 'diger',
});

/** Takvim etkinlik durumu. */
export const EVENT_STATUS = Object.freeze({
  PLANNED: 'planlandi',
  DONE: 'tamamlandi',
  CANCELLED: 'iptal',
});

/** Rapor kategorileri. */
export const REPORT_CATEGORY = Object.freeze({
  HERD: 'suru_performansi',
  FIELD: 'tarla_verim',
  STOCK: 'stok_hareketleri',
  FINANCE: 'finansal_analiz',
  CAMERA: 'kamera_olaylari',
  SYSTEM: 'sistem',
});

/** Rapor cikti bicimi. */
export const REPORT_FORMAT = Object.freeze({
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  CSV: 'CSV',
});

/** Kamera olay turleri (kamera ekranindaki "Son Kayitlar / Olaylar"). */
export const CAMERA_EVENT_TYPE = Object.freeze({
  MOTION: 'hareket_algilandi',
  OFFLINE: 'hat_disi',
  RECORDING: 'kayit_baslatildi',
  ANIMAL_DETECTED: 'hayvan_tespiti',
});

/**
 * Kamera goruntusunun nereden geldigi.
 * Raspberry Pi ajani hangi yakalama yolunu kullanacagini buradan ogrenir;
 * "sentetik" kaynak donanim olmadan uctan uca test icindir.
 */
export const CAMERA_SOURCE = Object.freeze({
  USB: 'usb', // V4L2 (/dev/videoN) uzerinden USB webcam
  CSI: 'csi', // Pi Camera Module (serit kablo, picamera2)
  RTSP: 'rtsp', // Pi yalnizca kopru; goruntu IP kameradan gelir
  SYNTHETIC: 'sentetik', // Donanimsiz test karesi
});

/** Kullanici hesap durumu (kullanicilar ekranindaki "Durum" kolonu). */
export const USER_STATUS = Object.freeze({
  ACTIVE: 'aktif',
  INVITED: 'planlandi',
  DISABLED: 'pasif',
});

// Gercek zamanli WebSocket olay adlari (frontend ile sozlesme).
export const SOCKET_EVENTS = Object.freeze({
  TELEMETRY_NEW: 'telemetry:new',
  ANIMAL_ZONE_CHANGED: 'animal:zoneChanged',
  ALERT_NEW: 'alert:new',
  CAMERA_OPEN: 'camera:open', // "Su kamerayi ac" komutu
  DEVICE_STATUS: 'device:status',
  CAMERA_STATUS: 'camera:status', // Kamera cevrimici/cevrimdisi oldu
  CAMERA_EVENT_NEW: 'camera:event', // Yeni kamera olayi (hareket vb.)
});

export default {
  ROLES,
  ROLE_VALUES,
  ANIMAL_GENDER,
  ANIMAL_STATUS,
  MOTION_STATE,
  DEVICE_STATUS,
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_SOURCE,
  ALERT_STATUS,
  FIELD_OPERATION,
  LACTATION_STAGE,
  HEALTH_RECORD_TYPE,
  IRRIGATION_STATUS,
  STOCK_CATEGORY,
  STOCK_MOVEMENT,
  STOCK_LEVEL,
  FINANCE_TYPE,
  FINANCE_STATUS,
  PAYMENT_METHOD,
  ACCOUNT_TYPE,
  CROP_RECORD_TYPE,
  CROP_RECORD_STATUS,
  EVENT_TYPE,
  EVENT_STATUS,
  REPORT_CATEGORY,
  REPORT_FORMAT,
  CAMERA_EVENT_TYPE,
  CAMERA_SOURCE,
  USER_STATUS,
  SOCKET_EVENTS,
};
