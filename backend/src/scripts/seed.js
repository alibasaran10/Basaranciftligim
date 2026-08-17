/**
 * Gelistirme icin ornek veri olusturur.
 * Kullanim: npm run seed
 *
 * Web ve mobil arayuzlerdeki TUM ekranlari gercek veriyle besleyecek sekilde
 * tasarlanmistir: ciftlik & kullanicilar, bolgeler, kameralar + olaylar,
 * cihazlar (API anahtarli), hayvanlar (sut/saglik gecmisiyle), tarlalar,
 * ekim & hasat kayitlari, stok + hareketler, finans (gelir/gider/kasa/butce),
 * takvim etkinlikleri, raporlar, alarmlar ve ornek telemetri.
 *
 * Rastgelelik tohumlu (deterministik) uretecle yapilir; ayni seed her
 * calistirmada ayni veriyi verir, boylece ekran goruntuleri ve testler kararli olur.
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { generateApiKey, hashToken } from '../common/security/tokens.js';
import { normalizeMac } from '../common/utils/mac.js';

import User from '../modules/user/user.model.js';
import Farm from '../modules/farm/farm.model.js';
import Zone from '../modules/zone/zone.model.js';
import Camera from '../modules/camera/camera.model.js';
import CameraEvent from '../modules/camera/cameraEvent.model.js';
import Device from '../modules/device/device.model.js';
import Animal from '../modules/animal/animal.model.js';
import Field from '../modules/field/field.model.js';
import CropRecord from '../modules/crop/cropRecord.model.js';
import StockItem from '../modules/stock/stockItem.model.js';
import StockMovement from '../modules/stock/stockMovement.model.js';
import FinanceTransaction from '../modules/finance/financeTransaction.model.js';
import Account from '../modules/finance/account.model.js';
import Budget from '../modules/finance/budget.model.js';
import CalendarEvent from '../modules/event/event.model.js';
import Report from '../modules/report/report.model.js';
import Alert from '../modules/alert/alert.model.js';
import Telemetry from '../modules/telemetry/telemetry.model.js';

import {
  ROLES,
  USER_STATUS,
  ANIMAL_GENDER,
  ANIMAL_STATUS,
  LACTATION_STAGE,
  HEALTH_RECORD_TYPE,
  IRRIGATION_STATUS,
  CROP_RECORD_TYPE,
  CROP_RECORD_STATUS,
  STOCK_CATEGORY,
  STOCK_MOVEMENT,
  FINANCE_TYPE,
  FINANCE_STATUS,
  PAYMENT_METHOD,
  ACCOUNT_TYPE,
  EVENT_TYPE,
  EVENT_STATUS,
  REPORT_CATEGORY,
  REPORT_FORMAT,
  CAMERA_EVENT_TYPE,
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_SOURCE,
  ALERT_STATUS,
  MOTION_STATE,
  DEVICE_STATUS,
} from '../common/constants.js';

// ---------------------------------------------------------------------------
// Yardimcilar
// ---------------------------------------------------------------------------

/** Tohumlu (deterministik) sozde-rastgele uretec — mulberry32. */
function makeRandom(seed = 20260728) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom();
const NOW = new Date();
const YEAR = NOW.getFullYear();

const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 1) => {
  const value = random() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
const pick = (arr) => arr[Math.floor(random() * arr.length)];

/** Bugunden N gun once/sonra (saat/dakika opsiyonel). */
function daysFromNow(days, hour = 9, minute = 0) {
  const date = new Date(NOW);
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateAt(year, month, day, hour = 9, minute = 0) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

const IMG = {
  fieldNorth: '/assets/field_north.png',
  fieldRiver: '/assets/field_river.png',
  fieldSouth: '/assets/field_south.png',
  cameraBarn: '/assets/camera_barn.png',
  farmHero: '/assets/farm_hero.png',
  farmMap: '/assets/farm_map.png',
  cow: '/assets/cow_portrait.png',
  profile: '/assets/profile_farmer.png',
};

// ---------------------------------------------------------------------------
// Seed adimlari
// ---------------------------------------------------------------------------

async function wipe() {
  await Promise.all([
    User.deleteMany({}),
    Farm.deleteMany({}),
    Zone.deleteMany({}),
    Camera.deleteMany({}),
    CameraEvent.deleteMany({}),
    Device.deleteMany({}),
    Animal.deleteMany({}),
    Field.deleteMany({}),
    CropRecord.deleteMany({}),
    StockItem.deleteMany({}),
    StockMovement.deleteMany({}),
    FinanceTransaction.deleteMany({}),
    Account.deleteMany({}),
    Budget.deleteMany({}),
    CalendarEvent.deleteMany({}),
    Report.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  // Telemetri time-series koleksiyonudur; silme yerine koleksiyon dusurulur.
  try {
    await mongoose.connection.db.dropCollection(Telemetry.collection.name);
  } catch {
    /* koleksiyon yoksa sorun degil */
  }
}

async function seedFarmAndUsers() {
  const owner = await User.create({
    name: 'Ali Başaran',
    email: 'info@basaranciftligi.com',
    password: 'Parola00',
    role: ROLES.ADMIN,
    phone: '+90 555 123 45 67',
    birthDate: dateAt(1985, 6, 15),
    jobTitle: 'İşletme Yöneticisi',
    accessScope: 'Tüm işletme',
    avatarUrl: IMG.profile,
    status: USER_STATUS.ACTIVE,
    lastLoginAt: daysFromNow(0, 8, 12),
  });

  const farm = await Farm.create({
    name: 'Başaran Çiftliği',
    owner: owner._id,
    location: { type: 'Point', coordinates: [27.8826, 39.6484] }, // Balıkesir merkez
    address: 'Atatürk Mah. 10. Sok. No:45 Merkez / Balıkesir',
    timezone: 'Europe/Istanbul',
    businessType: 'Büyükbaş Hayvancılık',
    taxNumber: '1234567890',
    phone: '+90 555 123 45 67',
    email: 'info@basaranciftligi.com',
    mapImageUrl: IMG.farmMap,
    subscription: {
      plan: 'PROFESYONEL',
      startedAt: dateAt(YEAR - 1, 8, 25),
      renewalAt: dateAt(YEAR + 1, 8, 25),
      limits: { animals: 100, fields: 20, cameras: 10, storageGb: 100, users: 10 },
      storageUsedGb: 32,
      annualPrice: 2400,
      currency: 'TRY',
      lastInvoiceAt: dateAt(YEAR - 1, 8, 25),
      features: [
        'Sınırsız Tarla Yönetimi',
        'Sınırsız Hayvan Kaydı',
        'Canlı Kamera Entegrasyonu (10 Adet)',
        '7/24 Teknik Destek',
        'Veri Yedekleme',
      ],
    },
    preferences: {
      notifications: true,
      cameraIntegration: true,
      deviceSettings: true,
      dataSync: true,
      security: true,
      apiIntegrations: false,
      pushEnabled: true,
      smsEnabled: false,
      emailEnabled: true,
    },
    weather: {
      temperature: 24,
      condition: 'Güneşli',
      humidity: 42,
      windKph: 11,
      updatedAt: NOW,
    },
    twoFactorEnabled: true,
    lastPasswordChangeAt: daysFromNow(-12),
  });

  owner.farm = farm._id;
  await owner.save();

  const team = await User.create([
    {
      name: 'Hasan Demir',
      email: 'hasan@basaranciftligi.com',
      password: 'Parola00',
      role: ROLES.FARMER,
      farm: farm._id,
      phone: '+90 555 222 11 08',
      jobTitle: 'Ziraat Sorumlusu',
      accessScope: 'Tarla ve Stok',
      status: USER_STATUS.ACTIVE,
      lastLoginAt: daysFromNow(0, 7, 40),
    },
    {
      name: 'Ayşe Yılmaz',
      email: 'ayse@basaranciftligi.com',
      password: 'Parola00',
      role: ROLES.FARMER,
      farm: farm._id,
      phone: '+90 555 333 90 24',
      jobTitle: 'Veteriner Hekim',
      accessScope: 'Sürü ve Takvim',
      status: USER_STATUS.ACTIVE,
      lastLoginAt: daysFromNow(-1, 18, 5),
    },
    {
      name: 'Ali Yıldız',
      email: 'ali@basaranciftligi.com',
      password: 'Parola00',
      role: ROLES.VIEWER,
      farm: farm._id,
      phone: '+90 555 444 76 12',
      jobTitle: 'Operatör',
      accessScope: 'Kameralar',
      status: USER_STATUS.ACTIVE,
      lastLoginAt: daysFromNow(-2, 11, 30),
    },
    {
      name: 'Teknik Ekip',
      email: 'destek@entegresuru.com',
      password: 'Parola00',
      role: ROLES.VIEWER,
      farm: farm._id,
      jobTitle: 'Destek',
      accessScope: 'Sistem',
      status: USER_STATUS.INVITED,
    },
  ]);

  return { farm, owner, team };
}

async function seedZones(farm) {
  return Zone.create([
    {
      farm: farm._id,
      name: 'Ahır 1 - Sağmal Bölümü',
      description: 'Sağmal ineklerin barındığı ana ahır.',
      routerMacs: ['aa:bb:cc:00:00:01', 'aa:bb:cc:00:00:02'],
    },
    {
      farm: farm._id,
      name: 'Ahır 2 - Kuru Bölümü',
      description: 'Kuruya ayrılan hayvanlar.',
      routerMacs: ['aa:bb:cc:00:00:03'],
    },
    {
      farm: farm._id,
      name: 'Ahır 3 - Buzağı Bölümü',
      description: 'Buzağı büyütme ünitesi.',
      routerMacs: ['aa:bb:cc:00:00:04'],
    },
    {
      farm: farm._id,
      name: 'Ahır 4 - Genç Hayvan',
      description: 'Düve ve genç hayvanlar.',
      routerMacs: ['aa:bb:cc:00:00:05'],
    },
    {
      farm: farm._id,
      name: 'Sağınhane',
      description: 'Günlük sağım ünitesi.',
      routerMacs: ['aa:bb:cc:00:00:06'],
    },
    {
      farm: farm._id,
      name: 'Mera',
      description: 'Açık otlatma alanı.',
      routerMacs: ['aa:bb:cc:00:00:07'],
    },
  ]);
}

async function seedCameras(farm, zones) {
  const [barn1, barn2, barn3, barn4, milking, pasture] = zones;

  const cameras = await Camera.create([
    {
      farm: farm._id,
      zone: barn1._id,
      name: '1. Büyük Ahır',
      ipAddress: '192.168.10.21',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Ahırlar',
      location: 'Ahır 1 - Sağmal Bölümü',
      snapshotUrl: IMG.cameraBarn,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 20 * 1000),
    },
    {
      farm: farm._id,
      zone: barn3._id,
      name: '2. Kuzu Ağılı Girişi',
      ipAddress: '192.168.10.22',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Ahırlar',
      location: 'Ahır 3 - Buzağı Bölümü',
      snapshotUrl: IMG.farmHero,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 35 * 1000),
    },
    {
      farm: farm._id,
      zone: pasture._id,
      name: '3. Kuzey Tarlası',
      ipAddress: '192.168.10.23',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Tarlalar',
      location: 'Kuzey Tarlası girişi',
      snapshotUrl: IMG.fieldNorth,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 12 * 1000),
    },
    {
      farm: farm._id,
      zone: barn2._id,
      name: '4. Yem Deposu',
      ipAddress: '192.168.10.24',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Depolar',
      location: 'Yem deposu koridoru',
      snapshotUrl: IMG.farmMap,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 48 * 1000),
    },
    {
      farm: farm._id,
      zone: barn4._id,
      name: '5. Makine Parkı',
      ipAddress: '192.168.10.25',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Makine Parkı',
      location: 'Traktör ve ekipman alanı',
      snapshotUrl: IMG.fieldRiver,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 60 * 1000),
    },
    {
      farm: farm._id,
      zone: pasture._id,
      name: '6. Sulama Bölgesi',
      ipAddress: '192.168.10.26',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Sulama Alanları',
      location: 'Dere Boyu sulama hattı',
      snapshotUrl: IMG.fieldSouth,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 90 * 1000),
    },
    {
      farm: farm._id,
      zone: milking._id,
      name: '7. Sağınhane',
      ipAddress: '192.168.10.27',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Ahırlar',
      location: 'Sağım ünitesi',
      snapshotUrl: IMG.cameraBarn,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 15 * 1000),
    },
    {
      farm: farm._id,
      zone: barn1._id,
      name: '8. Ahır 1 Koridor',
      ipAddress: '192.168.10.28',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Ahırlar',
      location: 'Ahır 1 koridor',
      snapshotUrl: IMG.farmHero,
      isRecording: false,
      // Cevrimdisi ornek (son kare 2 saat once).
      lastFrameAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      farm: farm._id,
      zone: barn2._id,
      name: '9. Tahıl Ambarı',
      ipAddress: '192.168.10.29',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Depolar',
      location: 'Tahıl ambarı',
      snapshotUrl: IMG.farmMap,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 25 * 1000),
    },
    {
      farm: farm._id,
      zone: pasture._id,
      name: '10. Güney Tarlası',
      ipAddress: '192.168.10.30',
      rtspPath: 'rtsp://__HOST__:554/stream1',
      group: 'Tarlalar',
      location: 'Güney Tarlası',
      snapshotUrl: IMG.fieldSouth,
      isRecording: true,
      lastFrameAt: new Date(NOW.getTime() - 42 * 1000),
    },
  ]);

  /**
   * Her kameraya bir saha ajani anahtari uretilir.
   *
   * Duz anahtar veritabanina YAZILMAZ (yalnizca SHA-256 ozeti saklanir);
   * seed ciktisinda bir kez gosterilir ki Raspberry Pi kurulumunda
   * dogrudan kullanilabilsin. Panelden istendiginde yenilenebilir.
   */
  const agentKeys = [];
  for (const camera of cameras) {
    const apiKey = generateApiKey();
    camera.streamKeyHash = hashToken(apiKey);
    await camera.save();
    agentKeys.push({ name: camera.name, id: String(camera._id), apiKey });
  }

  const eventTypes = [
    CAMERA_EVENT_TYPE.MOTION,
    CAMERA_EVENT_TYPE.ANIMAL_DETECTED,
    CAMERA_EVENT_TYPE.RECORDING,
    CAMERA_EVENT_TYPE.OFFLINE,
  ];

  const events = [];
  for (let i = 0; i < 40; i += 1) {
    const camera = cameras[i % cameras.length];
    events.push({
      farm: farm._id,
      camera: camera._id,
      type: i % 7 === 0 ? CAMERA_EVENT_TYPE.OFFLINE : pick(eventTypes),
      occurredAt: new Date(NOW.getTime() - i * 37 * 60 * 1000),
      durationSeconds: randInt(8, 180),
      thumbnailUrl: camera.snapshotUrl,
    });
  }
  await CameraEvent.insertMany(events);

  cameras.agentKeys = agentKeys;
  return cameras;
}

/** Tasarimlardaki one cikan hayvanlar (kupe numaralari birebir korunur). */
const FEATURED_ANIMALS = [
  {
    earTag: 'TR123456789',
    name: 'Sarıkız',
    breed: 'Holstein',
    ageYears: 4,
    ageMonths: 8,
    stage: LACTATION_STAGE.MILKING,
    status: ANIMAL_STATUS.ESTRUS,
    milk: 28.5,
    health: 88,
    weight: 620,
    barn: 'Ahır 1 - Sağmal Bölümü',
    inseminationDaysAgo: 100,
    birthInDays: 39,
    lactationNumber: 2,
  },
  {
    earTag: 'TR987654321',
    name: 'Benekli',
    breed: 'Simental',
    ageYears: 5,
    ageMonths: 2,
    stage: LACTATION_STAGE.MILKING,
    status: ANIMAL_STATUS.PREGNANT,
    milk: 24.1,
    health: 76,
    weight: 585,
    barn: 'Ahır 1 - Sağmal Bölümü',
    inseminationDaysAgo: 279,
    birthInDays: 4,
    lactationNumber: 3,
  },
  {
    earTag: 'TR456789123',
    name: 'Karagöz',
    breed: 'Holstein',
    ageYears: 3,
    ageMonths: 4,
    stage: LACTATION_STAGE.DRY,
    status: ANIMAL_STATUS.HEALTHY,
    milk: 0,
    health: 92,
    weight: 560,
    barn: 'Ahır 2 - Kuru Bölümü',
    inseminationDaysAgo: 277,
    birthInDays: 6,
    lactationNumber: 2,
  },
  {
    earTag: 'TR321654987',
    name: 'Pamuk',
    breed: 'Montofon',
    ageYears: 1,
    ageMonths: 2,
    stage: LACTATION_STAGE.CALF,
    status: ANIMAL_STATUS.HEALTHY,
    milk: 0,
    health: 95,
    weight: 210,
    barn: 'Ahır 3 - Buzağı Bölümü',
  },
  {
    earTag: 'TR654123789',
    name: 'Zeytin',
    breed: 'Brown Swiss',
    ageYears: 6,
    ageMonths: 1,
    stage: LACTATION_STAGE.MILKING,
    status: ANIMAL_STATUS.HEALTHY,
    milk: 31.2,
    health: 90,
    weight: 640,
    barn: 'Ahır 1 - Sağmal Bölümü',
    inseminationDaysAgo: 273,
    birthInDays: 10,
    lactationNumber: 4,
  },
  {
    earTag: 'TR555666777',
    name: 'Alaca',
    breed: 'Angus',
    ageYears: 2,
    ageMonths: 0,
    stage: LACTATION_STAGE.HEIFER,
    status: ANIMAL_STATUS.HEALTHY,
    milk: 0,
    health: 84,
    weight: 540,
    barn: 'Ahır 4 - Genç Hayvan',
  },
  {
    earTag: 'TR111222333',
    name: 'Yıldız',
    breed: 'Holstein',
    ageYears: 5,
    ageMonths: 0,
    stage: LACTATION_STAGE.MILKING,
    status: ANIMAL_STATUS.SICK,
    milk: 18.4,
    health: 62,
    weight: 600,
    barn: 'Ahır 1 - Sağmal Bölümü',
    lactationNumber: 3,
  },
];

const BREEDS = ['Holstein', 'Simental', 'Montofon', 'Brown Swiss', 'Angus', 'Jersey'];
const COW_NAMES = [
  'Sarıkız', 'Benekli', 'Karagöz', 'Pamuk', 'Zeytin', 'Alaca', 'Yıldız', 'Menekşe',
  'Fındık', 'Kestane', 'Gelincik', 'Nazlı', 'Duman', 'Kına', 'Papatya', 'Boncuk',
];

/**
 * Bir hayvan icin yil basindan bugune GUNLUK sut olcumu uretir.
 * Gunluk olmasi onemli: dashboard son 30 gunu gun gun cizdigi icin daha
 * seyrek ornekleme grafikte bosluk/testere deseni olusturur.
 */
function buildMilkRecords(baseLiters) {
  if (!baseLiters) return [];
  const records = [];
  const start = new Date(YEAR, 0, 1);
  for (let d = new Date(start); d <= NOW; d.setDate(d.getDate() + 1)) {
    // Mevsimsel dalga + gunluk gurultu (laktasyon egrisi hissi).
    const dayOfYear = Math.floor((d - start) / 86400000);
    const seasonal = 1 + 0.12 * Math.sin((dayOfYear / 365) * Math.PI * 2 - 1.2);
    const noise = 0.94 + random() * 0.12;
    records.push({
      date: new Date(d),
      liters: Math.round(baseLiters * seasonal * noise * 10) / 10,
    });
  }
  return records;
}

function buildHealthRecords(stage, inseminationDaysAgo) {
  const records = [
    {
      type: HEALTH_RECORD_TYPE.VACCINE,
      title: 'Şap Aşısı',
      date: daysFromNow(-randInt(80, 120)),
      performedBy: 'Ayşe Yılmaz',
    },
    {
      type: HEALTH_RECORD_TYPE.VACCINE,
      title: 'Brucella Aşısı',
      date: daysFromNow(-randInt(140, 180)),
      performedBy: 'Ayşe Yılmaz',
    },
    {
      type: HEALTH_RECORD_TYPE.CHECKUP,
      title: 'Rutin Veteriner Kontrolü',
      date: daysFromNow(-randInt(5, 40)),
      performedBy: 'Ayşe Yılmaz',
    },
  ];

  if (random() > 0.6) {
    records.push({
      type: HEALTH_RECORD_TYPE.TREATMENT,
      title: pick(['Mastitis tedavisi', 'Parazit tedavisi', 'Topallık tedavisi']),
      date: daysFromNow(-randInt(20, 70)),
      performedBy: 'Ayşe Yılmaz',
    });
  }

  if (inseminationDaysAgo) {
    records.push({
      type: HEALTH_RECORD_TYPE.INSEMINATION,
      title: 'Suni Tohumlama',
      date: daysFromNow(-inseminationDaysAgo),
      performedBy: 'Ayşe Yılmaz',
    });
    records.push({
      type: HEALTH_RECORD_TYPE.PREGNANCY_CHECK,
      title: 'Gebelik Kontrolü',
      date: daysFromNow(-Math.max(1, inseminationDaysAgo - 30)),
      performedBy: 'Ayşe Yılmaz',
    });
  }

  if (stage === LACTATION_STAGE.DRY) {
    records.push({
      type: HEALTH_RECORD_TYPE.DRY_OFF,
      title: 'Kuruya Ayırma',
      date: daysFromNow(-randInt(10, 50)),
      performedBy: 'Ayşe Yılmaz',
    });
  }

  return records;
}

async function seedAnimalsAndDevices(farm, zones) {
  const zoneByName = new Map(zones.map((z) => [z.name, z._id]));

  // Suru kirilimi: 32 sagmal, 14 kuru, 10 buzagi (+ 6 genc hayvan) = 62 bas.
  const specs = FEATURED_ANIMALS.map((a) => ({ ...a }));

  const targets = [
    { stage: LACTATION_STAGE.MILKING, count: 32 },
    { stage: LACTATION_STAGE.DRY, count: 14 },
    { stage: LACTATION_STAGE.CALF, count: 10 },
  ];

  const existingCounts = specs.reduce((acc, s) => {
    acc[s.stage] = (acc[s.stage] ?? 0) + 1;
    return acc;
  }, {});

  let tagSeq = 100;
  for (const target of targets) {
    const remaining = target.count - (existingCounts[target.stage] ?? 0);
    for (let i = 0; i < remaining; i += 1) {
      tagSeq += 1;
      const milking = target.stage === LACTATION_STAGE.MILKING;
      const calf = target.stage === LACTATION_STAGE.CALF;
      const pregnant = milking ? random() > 0.45 : target.stage === LACTATION_STAGE.DRY;
      const inseminationDaysAgo = pregnant ? randInt(40, 275) : null;

      specs.push({
        earTag: `TR${String(700000000 + tagSeq * 137)}`,
        name: pick(COW_NAMES),
        breed: pick(BREEDS),
        ageYears: calf ? 0 : randInt(2, 7),
        ageMonths: calf ? randInt(2, 11) : randInt(0, 11),
        stage: target.stage,
        status: pregnant ? ANIMAL_STATUS.PREGNANT : ANIMAL_STATUS.HEALTHY,
        milk: milking ? randFloat(18, 34) : 0,
        health: randInt(66, 99),
        weight: calf ? randInt(90, 240) : randInt(480, 690),
        barn: calf
          ? 'Ahır 3 - Buzağı Bölümü'
          : target.stage === LACTATION_STAGE.DRY
            ? 'Ahır 2 - Kuru Bölümü'
            : 'Ahır 1 - Sağmal Bölümü',
        inseminationDaysAgo,
        birthInDays: inseminationDaysAgo ? Math.max(1, 283 - inseminationDaysAgo) : null,
        lactationNumber: milking ? randInt(1, 5) : 0,
      });
    }
  }

  // Genc hayvanlar (duve) — sagmal/kuru/buzagi disinda kalan grup.
  for (let i = 0; i < 6; i += 1) {
    tagSeq += 1;
    specs.push({
      earTag: `TR${String(700000000 + tagSeq * 137)}`,
      name: pick(COW_NAMES),
      breed: pick(BREEDS),
      ageYears: 1,
      ageMonths: randInt(4, 11),
      stage: LACTATION_STAGE.HEIFER,
      status: ANIMAL_STATUS.HEALTHY,
      milk: 0,
      health: randInt(80, 98),
      weight: randInt(280, 420),
      barn: 'Ahır 4 - Genç Hayvan',
      lactationNumber: 0,
    });
  }

  const devicesInfo = [];
  const animals = [];

  for (let i = 0; i < specs.length; i += 1) {
    const spec = specs[i];

    // Her hayvana tasma takilmaz; sagmal ve gebe hayvanlar onceliklidir.
    const hasDevice = spec.stage !== LACTATION_STAGE.CALF || i % 3 === 0;
    let device = null;

    if (hasDevice) {
      const mac = normalizeMac(
        `aa:bb:cc:dd:${Math.floor(i / 256)
          .toString(16)
          .padStart(2, '0')}:${(i % 256).toString(16).padStart(2, '0')}`
      );
      const apiKey = generateApiKey();
      // Bir kismi dusuk pilli / cevrimdisi olsun (alarm ekranlari icin).
      const battery = i === 5 ? 18 : i === 6 ? 0 : randInt(35, 100);
      device = await Device.create({
        farm: farm._id,
        macAddress: mac,
        label: `Tasma-${String(i + 1).padStart(3, '0')}`,
        firmwareVersion: '1.4.2',
        apiKeyHash: hashToken(apiKey),
        batteryLevel: battery,
        status: battery === 0 ? DEVICE_STATUS.INACTIVE : DEVICE_STATUS.ACTIVE,
        lastSeenAt:
          battery === 0
            ? new Date(NOW.getTime() - 6 * 60 * 60 * 1000)
            : new Date(NOW.getTime() - randInt(1, 40) * 60 * 1000),
        lastBatteryReportAt: new Date(NOW.getTime() - randInt(1, 40) * 60 * 1000),
      });
      if (devicesInfo.length < 5) {
        devicesInfo.push({ mac, apiKey, animal: spec.earTag });
      }
    }

    const birthDate = new Date(NOW);
    birthDate.setFullYear(birthDate.getFullYear() - (spec.ageYears ?? 0));
    birthDate.setMonth(birthDate.getMonth() - (spec.ageMonths ?? 0));

    const animal = await Animal.create({
      farm: farm._id,
      earTag: spec.earTag,
      name: spec.name,
      species: 'sigir',
      breed: spec.breed,
      gender: ANIMAL_GENDER.FEMALE,
      birthDate,
      status: spec.status,
      lactationStage: spec.stage,
      lactationNumber: spec.lactationNumber ?? 0,
      weightKg: spec.weight,
      photoUrl: IMG.cow,
      barnSection: spec.barn,
      // Secere: onceki hayvanlarin kupe numaralarindan tutarli bir soy agaci.
      sireTag: i > 1 ? specs[(i * 7) % specs.length].earTag : 'TR900100200',
      damTag: i > 2 ? specs[(i * 11) % specs.length].earTag : 'TR900100201',
      lastInseminationAt: spec.inseminationDaysAgo ? daysFromNow(-spec.inseminationDaysAgo) : undefined,
      expectedBirthAt: spec.birthInDays ? daysFromNow(spec.birthInDays) : undefined,
      dailyMilkLiters: spec.milk,
      healthScore: spec.health,
      bodyTemperature: randFloat(38.2, 39.1),
      ruminationMinutes: randInt(420, 560),
      activityMinutes: randInt(45, 95),
      lastVetCheckAt: daysFromNow(-randInt(3, 45)),
      healthRecords: buildHealthRecords(spec.stage, spec.inseminationDaysAgo),
      milkRecords: buildMilkRecords(spec.milk),
      device: device?._id,
      currentZone: zoneByName.get(spec.barn) ?? zones[0]._id,
      lastMotionState: pick([MOTION_STATE.ACTIVE, MOTION_STATE.LYING, MOTION_STATE.GRAZING]),
      lastSeenAt: new Date(NOW.getTime() - randInt(1, 50) * 60 * 1000),
    });

    if (device) {
      device.assignedAnimal = animal._id;
      await device.save();
    }

    animals.push(animal);
  }

  return { animals, devicesInfo };
}

/** Tarlanin GeoJSON sinirini merkez noktadan kucuk bir kare olarak uretir. */
function squareBoundary(lng, lat, size = 0.01) {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng, lat],
        [lng + size, lat],
        [lng + size, lat + size],
        [lng, lat + size],
        [lng, lat],
      ],
    ],
  };
}

const FIELD_SPECS = [
  { name: 'Kuzey Tarlası', code: 'Parsel 12A', area: 45, soil: 'Killi Tınlı', crop: 'Yonca', variety: 'Prosementi 101', sow: [YEAR, 4, 10], harvest: [YEAR, 6, 20], irr: IRRIGATION_STATUS.GOOD, moisture: 75, method: 'Damlama', stage: 'Çiçeklenme', img: IMG.fieldNorth, alt: 1152, slope: 2, expected: 16, actual: 15 },
  { name: 'Dere Boyu', code: 'Parsel 7B', area: 28, soil: 'Tınlı', crop: 'Silajlık Mısır', variety: 'Pioneer P9911', sow: [YEAR, 5, 5], harvest: [YEAR, 9, 15], irr: IRRIGATION_STATUS.MEDIUM, moisture: 45, method: 'Yağmurlama', stage: 'Koçan Oluşumu', img: IMG.fieldRiver, alt: 795, slope: 1, expected: 14, actual: 12 },
  { name: 'Güney Tarlası', code: 'Parsel 3C', area: 32, soil: 'Kumlu Tınlı', crop: 'Buğday', variety: 'Tekirdağ 2023', sow: [YEAR - 1, 10, 20], harvest: [YEAR, 7, 1], irr: IRRIGATION_STATUS.GOOD, moisture: 70, method: 'Damlama', stage: 'Sapa Kalkma', img: IMG.fieldSouth, alt: 810, slope: 3, expected: 0.6, actual: 0.55 },
  { name: 'Çayır Altı', code: 'Parsel 9D', area: 18, soil: 'Tınlı', crop: 'Yonca', variety: 'Prosementi 101', sow: [YEAR, 4, 12], harvest: [YEAR, 6, 22], irr: IRRIGATION_STATUS.POOR, moisture: 18, method: 'Salma', stage: 'Sürgün Gelişimi', img: IMG.fieldRiver, alt: 802, slope: 4, expected: 15, actual: 11 },
  { name: 'Tepe Mevkii', code: 'Parsel 5E', area: 40, soil: 'Killi', crop: 'Arpa', variety: 'Arpa Yavuz', sow: [YEAR - 1, 11, 15], harvest: [YEAR, 6, 28], irr: IRRIGATION_STATUS.GOOD, moisture: 80, method: 'Yağmurlama', stage: 'Başaklanma', img: IMG.fieldNorth, alt: 1210, slope: 8, expected: 0.5, actual: 0.48 },
  { name: 'Doğu Tarlası', code: 'Parsel 14F', area: 26, soil: 'Killi Tınlı', crop: 'Buğday', variety: 'Tekirdağ 2023', sow: [YEAR - 1, 10, 25], harvest: [YEAR, 7, 5], irr: IRRIGATION_STATUS.MEDIUM, moisture: 52, method: 'Damlama', stage: 'Süt Olum', img: IMG.fieldSouth, alt: 840, slope: 2, expected: 0.58, actual: 0.54 },
  { name: 'Batı Tarlası', code: 'Parsel 2G', area: 22, soil: 'Kumlu', crop: 'Arpa', variety: 'Arpa Yavuz', sow: [YEAR - 1, 11, 20], harvest: [YEAR, 6, 30], irr: IRRIGATION_STATUS.NONE, moisture: 30, method: 'Salma', stage: 'Olgunlaşma', img: IMG.fieldNorth, alt: 780, slope: 5, expected: 0.45, actual: 0.4 },
  { name: 'Merkez Tarlası', code: 'Parsel 1H', area: 35, soil: 'Tınlı', crop: 'Yonca', variety: 'Prosementi 101', sow: [YEAR, 4, 18], harvest: [YEAR, 6, 25], irr: IRRIGATION_STATUS.GOOD, moisture: 68, method: 'Damlama', stage: 'Çiçeklenme', img: IMG.fieldRiver, alt: 815, slope: 1, expected: 16, actual: 15.5 },
  { name: 'Değirmen Yolu', code: 'Parsel 6J', area: 14, soil: 'Killi Tınlı', crop: 'Silajlık Mısır', variety: 'Pioneer P9241', sow: [YEAR, 5, 12], harvest: [YEAR, 9, 20], irr: IRRIGATION_STATUS.MEDIUM, moisture: 48, method: 'Yağmurlama', stage: 'Sap Uzaması', img: IMG.fieldRiver, alt: 790, slope: 2, expected: 13, actual: 0 },
  { name: 'Söğütlü', code: 'Parsel 8K', area: 12, soil: 'Tınlı', crop: 'Fiğ', variety: 'Yerli', sow: [YEAR, 3, 28], harvest: [YEAR, 6, 12], irr: IRRIGATION_STATUS.GOOD, moisture: 72, method: 'Damlama', stage: 'Hasat Edildi', img: IMG.fieldNorth, alt: 800, slope: 3, expected: 9, actual: 8.6 },
  { name: 'Karaova Düzü', code: 'Parsel 11L', area: 8, soil: 'Kumlu Tınlı', crop: 'Korunga', variety: 'Yerli', sow: [YEAR, 4, 2], harvest: [YEAR, 6, 18], irr: IRRIGATION_STATUS.NONE, moisture: 35, method: 'Salma', stage: 'Sürgün Gelişimi', img: IMG.fieldSouth, alt: 825, slope: 6, expected: 8, actual: 7.2 },
  { name: 'Bağ Yolu', code: 'Parsel 4M', area: 5, soil: 'Killi', crop: 'Yonca', variety: 'Prosementi 101', sow: [YEAR, 4, 22], harvest: [YEAR, 6, 27], irr: IRRIGATION_STATUS.MEDIUM, moisture: 55, method: 'Yağmurlama', stage: 'Çiçeklenme', img: IMG.fieldNorth, alt: 835, slope: 4, expected: 15, actual: 14 },
];

async function seedFields(farm, owner) {
  const fields = [];

  for (let i = 0; i < FIELD_SPECS.length; i += 1) {
    const spec = FIELD_SPECS[i];
    const field = await Field.create({
      farm: farm._id,
      name: spec.name,
      code: spec.code,
      crop: spec.crop,
      cropVariety: spec.variety,
      soilType: spec.soil,
      boundary: squareBoundary(36.9 + i * 0.02, 39.7 + i * 0.015),
      areaHectares: Math.round(spec.area * 0.1 * 100) / 100,
      areaDonum: spec.area,
      irrigation: {
        method: spec.method,
        status: spec.irr,
        moisturePercent: spec.moisture,
        lastIrrigatedAt: daysFromNow(-randInt(1, 9)),
      },
      growthStage: spec.stage,
      sowingDate: dateAt(spec.sow[0], spec.sow[1], spec.sow[2]),
      expectedHarvestDate: dateAt(spec.harvest[0], spec.harvest[1], spec.harvest[2]),
      altitudeMeters: spec.alt,
      slopePercent: spec.slope,
      locality: 'Çiftlik Mah. / Karaova',
      imageUrl: spec.img,
      expectedYieldPerDonum: spec.expected,
      actualYieldPerDonum: spec.actual,
      yieldUnit: 'Ton',
      notes:
        i === 0
          ? 'Bu yıl verim geçen yıla göre daha iyi. Sulama düzenli yapıldı, gübreleme planına sadık kalındı.'
          : '',
      operations: [
        { type: 'suruldu', date: dateAt(spec.sow[0], spec.sow[1], Math.max(1, spec.sow[2] - 12)), recordedBy: owner._id },
        { type: 'ekildi', date: dateAt(spec.sow[0], spec.sow[1], spec.sow[2]), recordedBy: owner._id },
        { type: 'gubrelendi', date: dateAt(spec.sow[0], spec.sow[1] + 1, 5), recordedBy: owner._id },
        { type: 'sulandi', date: daysFromNow(-randInt(2, 20)), recordedBy: owner._id },
        { type: 'ilaclandi', date: daysFromNow(-randInt(21, 45)), recordedBy: owner._id },
      ],
    });
    fields.push(field);
  }

  return fields;
}

async function seedCropRecords(farm, fields, owner) {
  const records = [];

  // Ekim & hasat kayitlari: her tarla icin bu sezon + gecen sezon.
  for (const field of fields) {
    for (const yearOffset of [0, 1]) {
      const sow = new Date(field.sowingDate);
      sow.setFullYear(sow.getFullYear() - yearOffset);

      records.push({
        farm: farm._id,
        field: field._id,
        type: CROP_RECORD_TYPE.SOWING,
        date: sow,
        crop: field.crop,
        variety: field.cropVariety,
        areaDonum: field.areaDonum,
        amount: randFloat(12, 30),
        unit: 'kg/da',
        method: pick(['Sıra Üzeri', 'Serpme']),
        cost: Math.round(field.areaDonum * randInt(900, 1500)),
        status: CROP_RECORD_STATUS.COMPLETED,
        season: String(sow.getFullYear()),
        recordedBy: owner._id,
      });

      const harvest = new Date(field.expectedHarvestDate);
      harvest.setFullYear(harvest.getFullYear() - yearOffset);
      const completed = harvest <= NOW;

      records.push({
        farm: farm._id,
        field: field._id,
        type: CROP_RECORD_TYPE.HARVEST,
        date: harvest,
        crop: field.crop,
        variety: field.cropVariety,
        areaDonum: field.areaDonum,
        amount: Math.round(field.areaDonum * (field.actualYieldPerDonum || 1) * 10) / 10,
        unit: 'Ton',
        method: 'Biçerdöver',
        cost: Math.round(field.areaDonum * randInt(180, 320)),
        revenue: Math.round(field.areaDonum * (field.actualYieldPerDonum || 1) * randInt(2600, 4200)),
        yieldPerDonum: field.actualYieldPerDonum,
        status: completed ? CROP_RECORD_STATUS.COMPLETED : CROP_RECORD_STATUS.PLANNED,
        season: String(harvest.getFullYear()),
        recordedBy: owner._id,
      });
    }
  }

  // Devam eden bir kayit (durum cesitliligi icin).
  records.push({
    farm: farm._id,
    field: fields[1]._id,
    type: CROP_RECORD_TYPE.HARVEST,
    date: daysFromNow(2),
    crop: 'Silajlık Mısır',
    variety: 'Pioneer P9911',
    areaDonum: 28,
    amount: 130,
    unit: 'Ton',
    method: 'Silaj Makinesi',
    cost: 36400,
    status: CROP_RECORD_STATUS.IN_PROGRESS,
    season: String(YEAR),
    recordedBy: owner._id,
  });

  await CropRecord.insertMany(records);
  return records.length;
}

const STOCK_SPECS = [
  { name: 'Yonca', category: STOCK_CATEGORY.FEED_CROP, warehouse: 'Silo 1', quantity: 120, unit: 'Ton', minLevel: 30, capacity: 150, unitPrice: 4200 },
  { name: 'Silajlık Mısır', category: STOCK_CATEGORY.SILAGE, warehouse: 'Silo 2', quantity: 85, unit: 'Ton', minLevel: 25, capacity: 120, unitPrice: 2800 },
  { name: 'Saman', category: STOCK_CATEGORY.HAY, warehouse: 'Kuru Ot Alanı', quantity: 80, unit: 'Ton', minLevel: 40, capacity: 120, unitPrice: 1900 },
  { name: 'Buğday', category: STOCK_CATEGORY.GRAIN, warehouse: 'Tahıl Ambarı', quantity: 8, unit: 'Ton', minLevel: 10, capacity: 40, unitPrice: 9500 },
  { name: 'Arpa', category: STOCK_CATEGORY.GRAIN, warehouse: 'Tahıl Ambarı', quantity: 4, unit: 'Ton', minLevel: 10, capacity: 40, unitPrice: 8800 },
  { name: 'Süt Yemi', category: STOCK_CATEGORY.CONCENTRATE, warehouse: 'Yem Deposu', quantity: 6.5, unit: 'Ton', minLevel: 5, capacity: 50, unitPrice: 12500 },
  { name: 'Kompoze Gübre', category: STOCK_CATEGORY.FERTILIZER, warehouse: 'Yem Deposu', quantity: 3.2, unit: 'Ton', minLevel: 2, capacity: 20, unitPrice: 16800 },
  { name: 'Motorin', category: STOCK_CATEGORY.FUEL, warehouse: 'Yakıt Tankı', quantity: 1.8, unit: 'Ton', minLevel: 1, capacity: 5, unitPrice: 43000 },
];

async function seedStock(farm, owner) {
  const items = await StockItem.create(STOCK_SPECS.map((s) => ({ ...s, farm: farm._id })));

  const movements = [];
  for (const item of items) {
    // Yil boyuna yayilmis giris/cikis hareketleri.
    for (let m = 0; m < 10; m += 1) {
      const direction = m % 3 === 0 ? STOCK_MOVEMENT.IN : STOCK_MOVEMENT.OUT;
      const amount =
        direction === STOCK_MOVEMENT.IN
          ? Math.round(item.quantity * randFloat(0.08, 0.25, 2) * 10) / 10
          : Math.round(item.quantity * randFloat(0.03, 0.12, 2) * 10) / 10;

      movements.push({
        farm: farm._id,
        item: item._id,
        direction,
        amount: Math.max(0.1, amount),
        unit: item.unit,
        date: daysFromNow(-randInt(1, 200), randInt(8, 17)),
        reason:
          direction === STOCK_MOVEMENT.IN
            ? pick(['Hasat girişi', 'Tedarikçi alımı', 'Depo transferi'])
            : pick(['Günlük yemleme', 'Satış çıkışı', 'Tarla kullanımı']),
        recordedBy: owner._id,
      });
    }
  }

  // Son giris/cikis kolonlarini doldurmak icin yakin tarihli hareketler.
  movements.push(
    { farm: farm._id, item: items[0]._id, direction: STOCK_MOVEMENT.IN, amount: 20, unit: 'Ton', date: daysFromNow(-3, 10), reason: 'Hasat girişi', recordedBy: owner._id },
    { farm: farm._id, item: items[0]._id, direction: STOCK_MOVEMENT.OUT, amount: 5, unit: 'Ton', date: daysFromNow(-1, 8), reason: 'Günlük yemleme', recordedBy: owner._id },
    { farm: farm._id, item: items[1]._id, direction: STOCK_MOVEMENT.IN, amount: 15, unit: 'Ton', date: daysFromNow(-5, 11), reason: 'Hasat girişi', recordedBy: owner._id },
    { farm: farm._id, item: items[1]._id, direction: STOCK_MOVEMENT.OUT, amount: 10, unit: 'Ton', date: daysFromNow(-2, 9), reason: 'Günlük yemleme', recordedBy: owner._id },
    { farm: farm._id, item: items[2]._id, direction: STOCK_MOVEMENT.IN, amount: 40, unit: 'Ton', date: daysFromNow(-6, 14), reason: 'Balya girişi', recordedBy: owner._id },
    { farm: farm._id, item: items[2]._id, direction: STOCK_MOVEMENT.OUT, amount: 20, unit: 'Ton', date: daysFromNow(-4, 16), reason: 'Günlük yemleme', recordedBy: owner._id }
  );

  await StockMovement.insertMany(movements);

  // Son giris/cikis ozetlerini kalemlere yaz (liste kolonlari).
  for (const item of items) {
    const [lastIn, lastOut] = await Promise.all([
      StockMovement.findOne({ item: item._id, direction: STOCK_MOVEMENT.IN }).sort({ date: -1 }).lean(),
      StockMovement.findOne({ item: item._id, direction: STOCK_MOVEMENT.OUT }).sort({ date: -1 }).lean(),
    ]);
    await StockItem.updateOne(
      { _id: item._id },
      {
        $set: {
          lastInAmount: lastIn?.amount ?? 0,
          lastInAt: lastIn?.date ?? null,
          lastOutAmount: lastOut?.amount ?? 0,
          lastOutAt: lastOut?.date ?? null,
        },
      }
    );
  }

  return { items, movementCount: movements.length };
}

const INCOME_CATEGORIES = [
  { category: 'Süt Satışları', weight: 0.45, counterparties: ['Sütaş A.Ş.', 'Yörsan Süt', 'Bölge Süt Koop.'] },
  { category: 'Ürün Satışları', weight: 0.25, counterparties: ['Tarım Koop.', 'Trakya Un San.', 'Yemsa Yem'] },
  { category: 'Canlı Hayvan', weight: 0.16, counterparties: ['Mehmet Yılmaz', 'Sivas Hayvan Pazarı'] },
  { category: 'Destek / Teşvik', weight: 0.09, counterparties: ['Tarım ve Orman B.'] },
  { category: 'Diğer Gelirler', weight: 0.05, counterparties: ['Muhtelif'] },
];

const EXPENSE_CATEGORIES = [
  { category: 'Yem Giderleri', weight: 0.39, counterparties: ['Yemsa Yem', 'Bölge Yem A.Ş.'] },
  { category: 'Tohum & Gübre', weight: 0.17, counterparties: ['Tarım Koop.', 'Agro Tohum'] },
  { category: 'İlaç & Veteriner', weight: 0.13, counterparties: ['Vetclinic', 'Ayşe Yılmaz'] },
  { category: 'İşçilik', weight: 0.11, counterparties: ['Mehmet Yılmaz', 'Mevsimlik Ekip'] },
  { category: 'Yakıt & Enerji', weight: 0.09, counterparties: ['Petrol Ofisi', 'Elektrik Dağıtım'] },
  { category: 'Makine Bakım', weight: 0.06, counterparties: ['Agro Servis'] },
  { category: 'Diğer Giderler', weight: 0.05, counterparties: ['Muhtelif'] },
];

const INCOME_DESCRIPTIONS = {
  'Süt Satışları': (n) => `Süt Satışı (${n * 50} Lt)`,
  'Ürün Satışları': (n) => `Ürün Satışı (${n * 5} Ton)`,
  'Canlı Hayvan': (n) => `Buzağı Satışı (${Math.max(1, n % 4)} Adet)`,
  'Destek / Teşvik': () => 'ÇKS Destek Ödemesi',
  'Diğer Gelirler': () => 'Gübre Satışı',
};

const EXPENSE_DESCRIPTIONS = {
  'Yem Giderleri': (n) => `Yem Alımı (${n * 50} Kg)`,
  'Tohum & Gübre': (n) => `Gübre Alımı (${n * 30} Kg)`,
  'İlaç & Veteriner': () => 'Veteriner Hizmeti',
  İşçilik: (n) => `İşçilik Ücreti (${Math.max(1, n % 8)} Gün)`,
  'Yakıt & Enerji': (n) => `Mazot Alımı (${n * 25} L)`,
  'Makine Bakım': () => 'Sulama Sistemi Bakımı',
  'Diğer Giderler': () => 'Kırtasiye ve Ofis Gideri',
};

async function seedFinance(farm, owner) {
  const accounts = await Account.create([
    { farm: farm._id, name: 'Merkez Kasa', type: ACCOUNT_TYPE.CASH, balance: 125350 },
    { farm: farm._id, name: 'Ziraat Bankası', type: ACCOUNT_TYPE.BANK, bankName: 'Ziraat Bankası', balance: 248900 },
    { farm: farm._id, name: 'Vakıfbank', type: ACCOUNT_TYPE.BANK, bankName: 'Vakıfbank', balance: 91500 },
  ]);

  const transactions = [];
  const methods = Object.values(PAYMENT_METHOD);
  const statusPool = [
    FINANCE_STATUS.COMPLETED,
    FINANCE_STATUS.COMPLETED,
    FINANCE_STATUS.COMPLETED,
    FINANCE_STATUS.PARTIAL,
    FINANCE_STATUS.PENDING,
  ];

  /** Bir yil icin gelir/gider islemleri uretir. */
  function buildYear(year, targetIncome, targetExpense) {
    const endMonth = year === YEAR ? NOW.getMonth() + 1 : 12;

    for (let month = 1; month <= endMonth; month += 1) {
      const monthlyIncome = targetIncome / 12;
      const monthlyExpense = targetExpense / 12;

      const groups = [
        { type: FINANCE_TYPE.INCOME, specs: INCOME_CATEGORIES, monthly: monthlyIncome, desc: INCOME_DESCRIPTIONS },
        { type: FINANCE_TYPE.EXPENSE, specs: EXPENSE_CATEGORIES, monthly: monthlyExpense, desc: EXPENSE_DESCRIPTIONS },
      ];

      for (const group of groups) {
        for (const spec of group.specs) {
          const count = spec.weight > 0.15 ? 3 : 1;
          for (let n = 1; n <= count; n += 1) {
            const amount = Math.round(((group.monthly * spec.weight) / count) * randFloat(0.75, 1.25, 2));
            const status = pick(statusPool);
            const paid =
              status === FINANCE_STATUS.COMPLETED
                ? amount
                : status === FINANCE_STATUS.PARTIAL
                  ? Math.round(amount * 0.5)
                  : 0;

            transactions.push({
              farm: farm._id,
              type: group.type,
              date: dateAt(year, month, randInt(1, 28)),
              description: group.desc[spec.category](n + month),
              category: spec.category,
              counterparty: pick(spec.counterparties),
              paymentMethod: pick(methods),
              account: pick(accounts)._id,
              amount,
              paidAmount: paid,
              status,
              dueDate: status === FINANCE_STATUS.COMPLETED ? undefined : daysFromNow(randInt(2, 25)),
              recordedBy: owner._id,
            });
          }
        }
      }
    }
  }

  buildYear(YEAR - 1, 2096000, 1562000);
  buildYear(YEAR, 2485750, 1754230);

  // Belge numaralarini tarihe gore sirali ata (GEL-2026-0001 ...).
  transactions.sort((a, b) => a.date - b.date);
  const counters = { [FINANCE_TYPE.INCOME]: 0, [FINANCE_TYPE.EXPENSE]: 0 };
  for (const tx of transactions) {
    counters[tx.type] += 1;
    const prefix = tx.type === FINANCE_TYPE.INCOME ? 'GEL' : 'GİD';
    tx.code = `${prefix}-${tx.date.getFullYear()}-${String(counters[tx.type]).padStart(4, '0')}`;
  }

  await FinanceTransaction.insertMany(transactions);

  await Budget.insertMany(
    EXPENSE_CATEGORIES.map((spec) => ({
      farm: farm._id,
      type: FINANCE_TYPE.EXPENSE,
      category: spec.category,
      year: YEAR,
      plannedAmount: Math.round(1754230 * spec.weight * 1.25),
    }))
  );

  return { accountCount: accounts.length, transactionCount: transactions.length };
}

const EVENT_TEMPLATES = [
  { type: EVENT_TYPE.BIRTH, title: 'Doğum Takibi', location: 'Ahır 1', assignee: 'Ayşe Yılmaz', hour: 10 },
  { type: EVENT_TYPE.INSEMINATION, title: 'Suni Tohumlama', location: 'Sağınhane', assignee: 'Ayşe Yılmaz', hour: 9 },
  { type: EVENT_TYPE.VETERINARY, title: 'Veteriner Randevusu', location: 'Ahır 1', assignee: 'Ayşe Yılmaz', hour: 9 },
  { type: EVENT_TYPE.VACCINE, title: 'Aşı Uygulaması', location: 'Ahır 2', assignee: 'Ayşe Yılmaz', hour: 11 },
  { type: EVENT_TYPE.HARVEST, title: 'Hasat', location: 'Kuzey Tarlası', assignee: 'Hasan Demir', hour: 14 },
  { type: EVENT_TYPE.IRRIGATION, title: 'Sulama', location: 'Dere Boyu', assignee: 'Hasan Demir', hour: 16 },
  { type: EVENT_TYPE.FERTILIZING, title: 'Gübreleme', location: 'Güney Tarlası', assignee: 'Hasan Demir', hour: 10 },
  { type: EVENT_TYPE.STOCK_COUNT, title: 'Stok Sayımı', location: 'Silo 1', assignee: 'Ali Başaran', hour: 15 },
  { type: EVENT_TYPE.MAINTENANCE, title: 'Ekipman Bakımı', location: 'Makine Parkı', assignee: 'Ali Yıldız', hour: 16 },
  { type: EVENT_TYPE.CAMERA_CHECK, title: 'Kamera Kontrolü', location: 'Tüm kameralar', assignee: 'Ali Yıldız', hour: 14 },
];

async function seedEvents(farm, owner, animals, fields) {
  const events = [];
  const daysInMonth = new Date(YEAR, NOW.getMonth() + 1, 0).getDate();

  // Icinde bulunulan ayin gunlerine yayilmis etkinlikler.
  for (let day = 1; day <= daysInMonth; day += 1) {
    const count = day % 4 === 0 ? 1 : randInt(0, 3);
    for (let i = 0; i < count; i += 1) {
      const tpl = EVENT_TEMPLATES[(day + i) % EVENT_TEMPLATES.length];
      const startAt = new Date(YEAR, NOW.getMonth(), day, tpl.hour, i === 0 ? 0 : 30);

      events.push({
        farm: farm._id,
        title: tpl.title,
        type: tpl.type,
        status: startAt < NOW ? EVENT_STATUS.DONE : EVENT_STATUS.PLANNED,
        priority:
          tpl.type === EVENT_TYPE.BIRTH
            ? ALERT_SEVERITY.CRITICAL
            : tpl.type === EVENT_TYPE.IRRIGATION
              ? ALERT_SEVERITY.HIGH
              : ALERT_SEVERITY.MEDIUM,
        startAt,
        endAt: new Date(startAt.getTime() + 90 * 60 * 1000),
        location: tpl.location,
        assignedLabel: tpl.assignee,
        animal: [EVENT_TYPE.BIRTH, EVENT_TYPE.INSEMINATION, EVENT_TYPE.VACCINE, EVENT_TYPE.VETERINARY].includes(tpl.type)
          ? animals[(day + i) % animals.length]._id
          : undefined,
        field: [EVENT_TYPE.HARVEST, EVENT_TYPE.IRRIGATION, EVENT_TYPE.FERTILIZING].includes(tpl.type)
          ? fields[(day + i) % fields.length]._id
          : undefined,
        createdBy: owner._id,
      });
    }
  }

  // Bugun icin sabit ajanda ("Bugünkü Ajanda" paneli).
  const today = NOW.getDate();
  events.push(
    {
      farm: farm._id,
      title: 'Veteriner Randevusu',
      type: EVENT_TYPE.VETERINARY,
      status: EVENT_STATUS.PLANNED,
      priority: ALERT_SEVERITY.HIGH,
      startAt: new Date(YEAR, NOW.getMonth(), today, 9, 0),
      location: 'Ahır 1',
      assignedLabel: 'Ayşe Yılmaz',
      createdBy: owner._id,
    },
    {
      farm: farm._id,
      title: 'Gübreleme',
      type: EVENT_TYPE.FERTILIZING,
      status: EVENT_STATUS.PLANNED,
      priority: ALERT_SEVERITY.MEDIUM,
      startAt: new Date(YEAR, NOW.getMonth(), today, 10, 0),
      location: 'Güney Tarlası',
      assignedLabel: 'Hasan Demir',
      field: fields[2]._id,
      createdBy: owner._id,
    },
    {
      farm: farm._id,
      title: 'Hasat',
      type: EVENT_TYPE.HARVEST,
      status: EVENT_STATUS.PLANNED,
      priority: ALERT_SEVERITY.HIGH,
      startAt: new Date(YEAR, NOW.getMonth(), today, 14, 0),
      location: 'Yonca · 2. Biçim',
      assignedLabel: 'Hasan Demir',
      field: fields[0]._id,
      createdBy: owner._id,
    },
    {
      farm: farm._id,
      title: 'Stok Sayımı',
      type: EVENT_TYPE.STOCK_COUNT,
      status: EVENT_STATUS.PLANNED,
      priority: ALERT_SEVERITY.MEDIUM,
      startAt: new Date(YEAR, NOW.getMonth(), today, 16, 0),
      location: 'Depo A',
      assignedLabel: 'Ali Başaran',
      createdBy: owner._id,
    }
  );

  // Gelecek ay birkac planli etkinlik.
  for (let day = 2; day <= 20; day += 6) {
    const tpl = EVENT_TEMPLATES[day % EVENT_TEMPLATES.length];
    events.push({
      farm: farm._id,
      title: tpl.title,
      type: tpl.type,
      status: EVENT_STATUS.PLANNED,
      priority: ALERT_SEVERITY.MEDIUM,
      startAt: new Date(YEAR, NOW.getMonth() + 1, day, tpl.hour, 0),
      location: tpl.location,
      assignedLabel: tpl.assignee,
      createdBy: owner._id,
    });
  }

  await CalendarEvent.insertMany(events);
  return events.length;
}

async function seedReports(farm, owner, team) {
  const authors = [owner, ...team];
  const titles = [
    ['Aylık Sürü Sağlık Raporu', REPORT_CATEGORY.HERD],
    ['Laktasyon Performans Analizi', REPORT_CATEGORY.HERD],
    ['Doğum ve Üreme Takip Raporu', REPORT_CATEGORY.HERD],
    ['Tarla Verim Analizi', REPORT_CATEGORY.FIELD],
    ['Sulama Etkinlik Raporu', REPORT_CATEGORY.FIELD],
    ['Haftalık Kritik Stok Raporu', REPORT_CATEGORY.STOCK],
    ['Depo Doluluk Raporu', REPORT_CATEGORY.STOCK],
    ['Nakit Akış Özeti', REPORT_CATEGORY.FINANCE],
    ['Kâr & Zarar Tablosu', REPORT_CATEGORY.FINANCE],
    ['Bütçe Gerçekleşme Raporu', REPORT_CATEGORY.FINANCE],
    ['Kamera Olayları Raporu', REPORT_CATEGORY.CAMERA],
    ['Sistem Kullanım Raporu', REPORT_CATEGORY.SYSTEM],
  ];

  const reports = [];
  for (let i = 0; i < 24; i += 1) {
    const [title, category] = titles[i % titles.length];
    const author = authors[i % authors.length];
    const generatedAt = daysFromNow(-i * 9, randInt(9, 18));

    reports.push({
      farm: farm._id,
      title: i < titles.length ? title : `${title} (${generatedAt.getFullYear()}/${generatedAt.getMonth() + 1})`,
      category,
      format: i % 5 === 0 ? REPORT_FORMAT.EXCEL : REPORT_FORMAT.PDF,
      periodStart: daysFromNow(-i * 9 - 30),
      periodEnd: generatedAt,
      generatedAt,
      generatedBy: author._id,
      generatedByName: author.name,
      isScheduled: i % 3 === 0,
      scheduleLabel: i % 3 === 0 ? "Her ayın 1'i" : undefined,
      downloadCount: randInt(0, 6),
      sizeBytes: randInt(120, 4200) * 1024,
    });
  }

  await Report.insertMany(reports);
  return reports.length;
}

async function seedAlerts(farm, animals, fields, cameras, stockItems, devices) {
  const alerts = [];
  const featured = new Map(animals.map((a) => [a.earTag, a]));

  const estrusAnimal = featured.get('TR123456789');
  const birthAnimal = featured.get('TR987654321');
  const sickAnimal = featured.get('TR111222333');
  const criticalStock = stockItems.find((s) => s.name === 'Arpa');
  const mediumStock = stockItems.find((s) => s.name === 'Buğday');
  const dryField = fields.find((f) => f.name === 'Çayır Altı');
  const offlineCamera = cameras.find((c) => c.name === '8. Ahır 1 Koridor');

  // --- Tasarimda birebir gorunen acik alarmlar ---
  alerts.push(
    {
      farm: farm._id,
      type: ALERT_TYPE.ESTRUS,
      source: ALERT_SOURCE.HERD,
      severity: ALERT_SEVERITY.CRITICAL,
      status: ALERT_STATUS.OPEN,
      title: 'Kızgınlık / Stres Alarmı',
      animal: estrusAnimal?._id,
      message: `${estrusAnimal?.earTag} küpeli inekte anormal hareketlilik tespit edildi.`,
      assignedLabel: 'Ali Başaran',
      cameraVerified: true,
      imageUrl: IMG.cameraBarn,
      createdAt: daysFromNow(0, 10, 24),
      dedupeKey: 'seed-estrus-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.BIRTH_APPROACHING,
      source: ALERT_SOURCE.HERD,
      severity: ALERT_SEVERITY.HIGH,
      status: ALERT_STATUS.OPEN,
      title: 'Doğum Yaklaşıyor',
      animal: birthAnimal?._id,
      message: `${birthAnimal?.earTag} küpeli inek için tahmini doğuma 4 gün kaldı.`,
      assignedLabel: 'Ayşe Yılmaz',
      imageUrl: IMG.cow,
      createdAt: daysFromNow(0, 8, 15),
      dedupeKey: 'seed-birth-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.TEMPERATURE,
      source: ALERT_SOURCE.FIELD,
      severity: ALERT_SEVERITY.MEDIUM,
      status: ALERT_STATUS.OPEN,
      title: 'Sıcaklık Uyarısı',
      field: fields[0]?._id,
      message: 'Kuzey Tarlası · Silo 2 sıcaklık eşiği aşıldı.',
      assignedLabel: 'Ali Başaran',
      createdAt: daysFromNow(0, 6, 40),
      dedupeKey: 'seed-temp-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.IRRIGATION,
      source: ALERT_SOURCE.FIELD,
      severity: ALERT_SEVERITY.MEDIUM,
      status: ALERT_STATUS.OPEN,
      title: 'Sulama Uyarısı',
      field: dryField?._id,
      message: 'Çayır Altı · Nem seviyesi %18, kritik seviyede.',
      assignedLabel: 'Hasan Demir',
      imageUrl: IMG.farmMap,
      createdAt: daysFromNow(-1, 22, 30),
      dedupeKey: 'seed-irrigation-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.CRITICAL_STOCK,
      source: ALERT_SOURCE.STOCK,
      severity: ALERT_SEVERITY.HIGH,
      status: ALERT_STATUS.OPEN,
      title: 'Kritik Stok',
      stockItem: criticalStock?._id,
      message: 'Arpa · Tahıl Ambarı stoğu minimum seviyenin altında.',
      assignedLabel: 'Ayşe Yılmaz',
      createdAt: daysFromNow(-1, 18, 45),
      dedupeKey: 'seed-stock-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.CRITICAL_STOCK,
      source: ALERT_SOURCE.STOCK,
      severity: ALERT_SEVERITY.MEDIUM,
      status: ALERT_STATUS.OPEN,
      title: 'Stok Seviyesi Düşük',
      stockItem: mediumStock?._id,
      message: 'Buğday · Tahıl Ambarı stoğu orta seviyeye indi.',
      assignedLabel: 'Hasan Demir',
      createdAt: daysFromNow(-2, 12, 10),
      dedupeKey: 'seed-stock-2',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.CAMERA_OFFLINE,
      source: ALERT_SOURCE.CAMERA,
      severity: ALERT_SEVERITY.LOW,
      status: ALERT_STATUS.OPEN,
      title: 'Kamera Bağlantı Sorunu',
      camera: offlineCamera?._id,
      message: '8. Ahır 1 Koridor kamerası yanıt vermiyor.',
      assignedLabel: 'Teknik Ekip',
      createdAt: daysFromNow(-1, 17, 5),
      dedupeKey: 'seed-camera-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.VACCINATION_DUE,
      source: ALERT_SOURCE.HERD,
      severity: ALERT_SEVERITY.MEDIUM,
      status: ALERT_STATUS.ACKNOWLEDGED,
      title: 'Aşılama Hatırlatması',
      animal: featured.get('TR654123789')?._id,
      message: 'TR654123789 için şap aşısı zamanı geldi.',
      assignedLabel: 'Ayşe Yılmaz',
      acknowledgedAt: daysFromNow(-1, 16, 0),
      createdAt: daysFromNow(-1, 15, 20),
      dedupeKey: 'seed-vaccine-1',
    },
    {
      farm: farm._id,
      type: ALERT_TYPE.DISEASE,
      source: ALERT_SOURCE.HERD,
      severity: ALERT_SEVERITY.CRITICAL,
      status: ALERT_STATUS.OPEN,
      title: 'Hastalık Şüphesi',
      animal: sickAnimal?._id,
      message: 'TR111222333 küpeli inekte süt veriminde ani düşüş ve ateş.',
      assignedLabel: 'Ayşe Yılmaz',
      cameraVerified: true,
      createdAt: daysFromNow(0, 7, 5),
      dedupeKey: 'seed-disease-1',
    }
  );

  // Dusuk pil / cevrimdisi cihaz alarmlari (gercek cihazlardan turetilir).
  const lowBatteryDevices = devices.filter((d) => d.batteryLevel <= 20).slice(0, 4);
  for (const device of lowBatteryDevices) {
    alerts.push({
      farm: farm._id,
      type: device.batteryLevel === 0 ? ALERT_TYPE.DEVICE_OFFLINE : ALERT_TYPE.LOW_BATTERY,
      source: ALERT_SOURCE.DEVICE,
      severity: device.batteryLevel === 0 ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
      status: ALERT_STATUS.OPEN,
      title: device.batteryLevel === 0 ? 'Cihaz Çevrimdışı' : 'Düşük Pil Uyarısı',
      device: device._id,
      animal: device.assignedAnimal,
      message: `${device.label} (${device.macAddress}) · pil %${device.batteryLevel}`,
      assignedLabel: 'Teknik Ekip',
      createdAt: daysFromNow(-randInt(0, 3), randInt(6, 20)),
      dedupeKey: `seed-battery-${device._id}`,
    });
  }

  // --- Gecmis (cozulmus / goruldu) alarmlar: trend ve sayaclar icin ---
  const historyTypes = [
    { type: ALERT_TYPE.ESTRUS, source: ALERT_SOURCE.HERD, title: 'Kızgınlık / Stres Alarmı', severity: ALERT_SEVERITY.CRITICAL },
    { type: ALERT_TYPE.ABNORMAL_MOTION, source: ALERT_SOURCE.HERD, title: 'Anormal Hareket', severity: ALERT_SEVERITY.HIGH },
    { type: ALERT_TYPE.LOW_BATTERY, source: ALERT_SOURCE.DEVICE, title: 'Düşük Pil Uyarısı', severity: ALERT_SEVERITY.MEDIUM },
    { type: ALERT_TYPE.IRRIGATION, source: ALERT_SOURCE.FIELD, title: 'Sulama Uyarısı', severity: ALERT_SEVERITY.MEDIUM },
    { type: ALERT_TYPE.TEMPERATURE, source: ALERT_SOURCE.FIELD, title: 'Sıcaklık Uyarısı', severity: ALERT_SEVERITY.LOW },
    { type: ALERT_TYPE.CRITICAL_STOCK, source: ALERT_SOURCE.STOCK, title: 'Kritik Stok', severity: ALERT_SEVERITY.HIGH },
    { type: ALERT_TYPE.CAMERA_OFFLINE, source: ALERT_SOURCE.CAMERA, title: 'Kamera Bağlantı Sorunu', severity: ALERT_SEVERITY.LOW },
    { type: ALERT_TYPE.VACCINATION_DUE, source: ALERT_SOURCE.HERD, title: 'Aşılama Hatırlatması', severity: ALERT_SEVERITY.MEDIUM },
  ];

  const assignees = ['Ali Başaran', 'Ayşe Yılmaz', 'Hasan Demir', 'Ali Yıldız', 'Teknik Ekip'];

  for (let i = 0; i < 116; i += 1) {
    const tpl = historyTypes[i % historyTypes.length];
    const createdAt = daysFromNow(-randInt(1, 60), randInt(0, 23), randInt(0, 59));
    // Cogunlugu cozulmus; bir kismi goruldu durumunda.
    const resolved = i % 6 !== 0;
    const animal = tpl.source === ALERT_SOURCE.HERD ? animals[i % animals.length] : null;

    alerts.push({
      farm: farm._id,
      type: tpl.type,
      source: tpl.source,
      severity: tpl.severity,
      status: resolved ? ALERT_STATUS.RESOLVED : ALERT_STATUS.ACKNOWLEDGED,
      title: tpl.title,
      animal: animal?._id,
      field: tpl.source === ALERT_SOURCE.FIELD ? fields[i % fields.length]._id : undefined,
      camera: tpl.source === ALERT_SOURCE.CAMERA ? cameras[i % cameras.length]._id : undefined,
      stockItem: tpl.source === ALERT_SOURCE.STOCK ? stockItems[i % stockItems.length]._id : undefined,
      message: animal
        ? `${animal.earTag} · ${tpl.title.toLocaleLowerCase('tr-TR')} kaydı`
        : `${tpl.title} · otomatik tespit`,
      assignedLabel: assignees[i % assignees.length],
      cameraVerified: i % 3 === 0,
      createdAt,
      acknowledgedAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
      resolvedAt: resolved ? new Date(createdAt.getTime() + 3 * 60 * 60 * 1000) : undefined,
      dedupeKey: `seed-history-${i}`,
    });
  }

  // timestamps:false -> gecmise donuk createdAt degerleri korunur.
  await Alert.insertMany(alerts, { timestamps: false });
  return alerts.length;
}

async function seedTelemetry(farm, animals) {
  const withDevice = animals.filter((a) => a.device).slice(0, 12);
  const docs = [];

  for (const animal of withDevice) {
    for (let i = 0; i < 24; i += 1) {
      const ts = new Date(NOW.getTime() - i * 15 * 60 * 1000);
      const magnitude = randFloat(0.6, 1.8, 2);
      docs.push({
        ts,
        meta: {
          farm: farm._id,
          device: animal.device,
          animal: animal._id,
          mac: `aa:bb:cc:dd:00:${(i % 256).toString(16).padStart(2, '0')}`,
        },
        accel: { x: randFloat(-1, 1, 2), y: randFloat(-1, 1, 2), z: randFloat(-1, 1, 2), magnitude },
        motionState: pick([MOTION_STATE.ACTIVE, MOTION_STATE.LYING, MOTION_STATE.GRAZING]),
        battery: randInt(40, 100),
        rssiScans: [{ bssid: 'aa:bb:cc:00:00:01', rssi: randInt(-80, -45) }],
        detectedZone: animal.currentZone,
        detectedZoneRssi: randInt(-70, -40),
        ingestedVia: 'http',
      });
    }
  }

  if (docs.length) await Telemetry.insertMany(docs);
  return docs.length;
}

// ---------------------------------------------------------------------------
// Ana akis
// ---------------------------------------------------------------------------

async function run() {
  if (env.isProd) {
    throw new Error('seed production ortaminda calistirilamaz');
  }

  await connectDatabase();
  await wipe();

  const { farm, owner, team } = await seedFarmAndUsers();
  const zones = await seedZones(farm);
  const cameras = await seedCameras(farm, zones);
  const { animals, devicesInfo } = await seedAnimalsAndDevices(farm, zones);
  const fields = await seedFields(farm, owner);
  const cropCount = await seedCropRecords(farm, fields, owner);
  const { items: stockItems, movementCount } = await seedStock(farm, owner);
  const { accountCount, transactionCount } = await seedFinance(farm, owner);
  const eventCount = await seedEvents(farm, owner, animals, fields);
  const reportCount = await seedReports(farm, owner, team);

  const devices = await Device.find({ farm: farm._id }).lean();
  const alertCount = await seedAlerts(farm, animals, fields, cameras, stockItems, devices);
  const telemetryCount = await seedTelemetry(farm, animals);

  /* eslint-disable no-console */
  console.log('\n=== SEED TAMAMLANDI ===');
  console.log(`Ciftlik      : ${farm.name}`);
  console.log(`Kullanicilar : ${team.length + 1}`);
  console.log(`Bolgeler     : ${zones.length}`);
  console.log(`Kameralar    : ${cameras.length}`);
  console.log(`Cihazlar     : ${devices.length}`);
  console.log(`Hayvanlar    : ${animals.length}`);
  console.log(`Tarlalar     : ${fields.length}`);
  console.log(`Ekim/Hasat   : ${cropCount}`);
  console.log(`Stok kalemi  : ${stockItems.length} (${movementCount} hareket)`);
  console.log(`Finans       : ${transactionCount} islem, ${accountCount} hesap`);
  console.log(`Takvim       : ${eventCount} etkinlik`);
  console.log(`Raporlar     : ${reportCount}`);
  console.log(`Alarmlar     : ${alertCount}`);
  console.log(`Telemetri    : ${telemetryCount} kayit`);
  console.log('\nGiris: info@basaranciftligi.com / Parola00');
  console.log('\nCihaz API anahtarlari (simulasyon icin, x-device-key):');
  for (const d of devicesInfo) {
    console.log(`  ${d.mac}  (${d.animal})  ->  ${d.apiKey}`);
  }

  // Kamera ajan anahtarlari: duz hali yalnizca burada gorunur, DB'de
  // yalnizca SHA-256 ozeti tutulur. Raspberry Pi kurulumunda kullanilir.
  console.log('\nKamera ajan anahtarlari (Raspberry Pi icin, x-camera-key):');
  for (const c of cameras.agentKeys ?? []) {
    console.log(`  ${c.name.padEnd(24)} ->  ${c.apiKey}`);
  }
  console.log('\n  Pi ajanini baslatmak icin (kurulum: pi-agent/README.md):');
  console.log('    python3 pi-agent/agent.py \\');
  console.log(`      --url ws://<sunucu-ip>:${env.PORT}/ingest/camera \\`);
  console.log('      --key <yukaridaki anahtarlardan biri>');
  console.log('\n  Kamera olmadan uctan uca denemek icin sona ekleyin:');
  console.log('      --force-source sentetik');
  console.log('');
  /* eslint-enable no-console */

  await disconnectDatabase();
  await mongoose.disconnect();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed hatasi:', err);
  process.exit(1);
});
