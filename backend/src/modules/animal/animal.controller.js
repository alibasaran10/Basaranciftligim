import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Animal from './animal.model.js';
import Alert from '../alert/alert.model.js';
import {
  LACTATION_STAGE,
  ALERT_STATUS,
  ALERT_SOURCE,
  HEALTH_RECORD_TYPE,
} from '../../common/constants.js';
import { monthlySeries } from '../../common/utils/series.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';

/** Oturumdaki ciftligi ObjectId olarak dondurur. */
function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

/**
 * GET /animals/summary
 * Suru yonetimi ekranindaki tum ozet kartlari, dagilim grafikleri ve
 * yan panelleri tek istekte besler (N+1 istek olmasin diye).
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  const [stageCounts, healthBuckets, barnBuckets, breeds, upcomingBirths, openAlerts, milkAgg] =
    await Promise.all([
      Animal.aggregate([
        { $match: { farm, isActive: true } },
        { $group: { _id: '$lactationStage', count: { $sum: 1 } } },
      ]),
      // Saglik skoru kirilimi: Saglikli / Izlemede / Tedavi / Riskli.
      Animal.aggregate([
        { $match: { farm, isActive: true } },
        {
          $bucket: {
            groupBy: { $ifNull: ['$healthScore', 100] },
            boundaries: [0, 50, 70, 85, 101],
            default: 101,
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      Animal.aggregate([
        { $match: { farm, isActive: true, barnSection: { $nin: [null, ''] } } },
        { $group: { _id: '$barnSection', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Animal.distinct('breed', { farm, isActive: true }),
      Animal.find({
        farm,
        isActive: true,
        expectedBirthAt: { $gte: now, $lte: in15Days },
      })
        .select('earTag breed birthDate expectedBirthAt photoUrl')
        .sort({ expectedBirthAt: 1 })
        .limit(10)
        .lean(),
      Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN, source: ALERT_SOURCE.HERD }),
      // Aylik ortalama sut uretimi (laktasyon trend grafigi).
      Animal.aggregate([
        { $match: { farm, isActive: true } },
        { $unwind: '$milkRecords' },
        {
          $group: {
            _id: { y: { $year: '$milkRecords.date' }, m: { $month: '$milkRecords.date' } },
            total: { $sum: '$milkRecords.liters' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
    ]);

  const stage = Object.fromEntries(stageCounts.map((s) => [s._id, s.count]));
  const total = stageCounts.reduce((acc, s) => acc + s.count, 0);

  // Grafik etiketleri dogrudan arayuzde gosterilir; Turkce yazimi korunur.
  const bucketLabels = ['Riskli', 'Tedavi', 'İzlemede', 'Sağlıklı'];
  const healthDistribution = bucketLabels.map((name, i) => ({
    name,
    value: healthBuckets.find((b) => b._id === [0, 50, 70, 85][i])?.count ?? 0,
  }));

  const barnDistribution = barnBuckets.map((b) => ({
    name: b._id,
    count: b.count,
    percent: total ? Math.round((b.count / total) * 100) : 0,
  }));

  return sendSuccess(res, {
    data: {
      totals: {
        total,
        milking: stage[LACTATION_STAGE.MILKING] ?? 0,
        dry: stage[LACTATION_STAGE.DRY] ?? 0,
        calves: stage[LACTATION_STAGE.CALF] ?? 0,
        heifers: stage[LACTATION_STAGE.HEIFER] ?? 0,
        upcomingBirths: upcomingBirths.length,
        openAlerts,
      },
      healthDistribution,
      barnDistribution,
      breeds: breeds.filter(Boolean).sort(),
      upcomingBirths: upcomingBirths.map((a) => ({
        ...a,
        daysLeft: Math.max(
          0,
          Math.ceil((new Date(a.expectedBirthAt).getTime() - now.getTime()) / 86400000)
        ),
      })),
      milkTrend: monthlySeries(milkAgg).map((point) => ({
        name: point.name,
        value: Math.round(point.total),
      })),
    },
  });
});

/**
 * GET /animals/:id/detail
 * Hayvan detay ekrani: kimlik, biyolojik takvim, saglik gecmisi, alarmlar
 * ve gunluk sensor serileri tek pakette.
 */
export const detail = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const animal = await Animal.findOne({ _id: req.params.id, farm })
    .populate('currentZone', 'name')
    .populate('device', 'macAddress label batteryLevel status lastSeenAt firmwareVersion')
    .lean();
  if (!animal) throw ApiError.notFound('Hayvan bulunamadi');

  const alerts = await Alert.find({ farm, animal: animal._id })
    .select('type title severity status message createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const healthRecords = [...(animal.healthRecords || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Biyolojik takvim: tohumlama -> gebelik kontrolu -> kuruya ayirma -> dogum.
  const timeline = [
    { key: HEALTH_RECORD_TYPE.INSEMINATION, label: 'Tohumlama Tarihi', date: animal.lastInseminationAt },
    {
      key: HEALTH_RECORD_TYPE.PREGNANCY_CHECK,
      label: 'Gebelik Kontrolü',
      date: healthRecords.find((r) => r.type === HEALTH_RECORD_TYPE.PREGNANCY_CHECK)?.date ?? null,
    },
    {
      key: HEALTH_RECORD_TYPE.DRY_OFF,
      label: 'Kuruya Ayırma',
      date: healthRecords.find((r) => r.type === HEALTH_RECORD_TYPE.DRY_OFF)?.date ?? null,
    },
    { key: HEALTH_RECORD_TYPE.BIRTH, label: 'Tahmini Doğum', date: animal.expectedBirthAt },
  ].map((step) => ({ ...step, done: !!step.date && new Date(step.date) <= new Date() }));

  // Son 7 gunun sut serisi (detay ekranindaki mini grafikler).
  const milkSeries = [...(animal.milkRecords || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-8)
    .map((r) => ({
      name: new Date(r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      value: r.liters,
    }));

  return sendSuccess(res, {
    data: {
      animal,
      alerts,
      healthRecords,
      timeline,
      milkSeries,
      // Zamana bagli turetilmis degerler sunucuda hesaplanir; boylece arayuz
      // render sirasinda saat okumak zorunda kalmaz ve web/mobil ayni sonucu gorur.
      derived: {
        ageLabel: ageLabel(animal.birthDate),
        healthLabel: healthLabel(animal.healthScore),
        lactationLabel: LACTATION_LABELS[animal.lactationStage] ?? '—',
        daysToBirth: animal.expectedBirthAt
          ? Math.max(
              0,
              Math.ceil((new Date(animal.expectedBirthAt).getTime() - Date.now()) / 86400000)
            )
          : null,
      },
    },
  });
});

/** POST /animals/:id/health-records — asi/tedavi/tohumlama kaydi ekler. */
export const addHealthRecord = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const record = {
    ...req.body,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    recordedBy: req.auth.userId,
  };

  const update = { $push: { healthRecords: record } };
  // Ureme kayitlari denormalize alanlari da gunceller.
  if (record.type === HEALTH_RECORD_TYPE.INSEMINATION) {
    update.$set = {
      lastInseminationAt: record.date,
      // Sigirda ortalama gebelik suresi 283 gun.
      expectedBirthAt: new Date(record.date.getTime() + 283 * 86400000),
    };
  } else if (record.type === HEALTH_RECORD_TYPE.BIRTH) {
    update.$set = { lastCalvingAt: record.date, expectedBirthAt: null };
  } else if (record.type === HEALTH_RECORD_TYPE.CHECKUP) {
    update.$set = { lastVetCheckAt: record.date };
  }

  const animal = await Animal.findOneAndUpdate({ _id: req.params.id, farm }, update, {
    new: true,
    runValidators: true,
  });
  if (!animal) throw ApiError.notFound('Hayvan bulunamadi');

  return sendCreated(res, { data: animal, message: 'Saglik kaydi eklendi' });
});

/** POST /animals/:id/milk-records — gunluk sut olcumu ekler. */
export const addMilkRecord = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const animal = await Animal.findOneAndUpdate(
    { _id: req.params.id, farm },
    {
      $push: { milkRecords: { date, liters: req.body.liters } },
      $set: { dailyMilkLiters: req.body.liters },
    },
    { new: true, runValidators: true }
  );
  if (!animal) throw ApiError.notFound('Hayvan bulunamadi');

  return sendCreated(res, { data: animal, message: 'Sut olcumu kaydedildi' });
});

export const LACTATION_LABELS = Object.freeze({
  [LACTATION_STAGE.MILKING]: 'Sağmal',
  [LACTATION_STAGE.DRY]: 'Kuru',
  [LACTATION_STAGE.CALF]: 'Buzağı',
  [LACTATION_STAGE.HEIFER]: 'Genç',
  [LACTATION_STAGE.BEEF]: 'Besi',
});

const GENDER_LABELS = Object.freeze({ disi: 'Dişi', erkek: 'Erkek' });

/** Dogum tarihinden "4 Yaş 8 Ay" metni uretir. */
function ageLabel(birthDate) {
  if (!birthDate) return '—';
  const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (30.44 * 86400000));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years <= 0) return `${months} Ay`;
  return rest ? `${years} Yaş ${rest} Ay` : `${years} Yaş`;
}

/** Saglik skorundan arayuz etiketi. */
function healthLabel(score) {
  const value = Number(score ?? 100);
  if (value >= 85) return 'İyi';
  if (value >= 70) return 'İzlemede';
  if (value >= 50) return 'Tedavi';
  return 'Riskli';
}

/**
 * Hayvan dokumanini suru listesi/mobil kartlari icin duz nesneye cevirir.
 * Bicimlendirme tek yerde yapilir; web ve mobil ayni metinleri gorur.
 */
export function presentAnimal(animal) {
  return {
    id: String(animal._id),
    earTag: animal.earTag,
    name: animal.name ?? '',
    breed: animal.breed ?? '—',
    species: animal.species ?? '',
    gender: animal.gender,
    genderLabel: GENDER_LABELS[animal.gender] ?? animal.gender,
    birthDate: animal.birthDate ?? null,
    ageLabel: ageLabel(animal.birthDate),
    status: animal.status,
    lactationStage: animal.lactationStage,
    lactationLabel: LACTATION_LABELS[animal.lactationStage] ?? '—',
    lactationNumber: animal.lactationNumber ?? 0,
    weightKg: animal.weightKg ?? null,
    barnSection: animal.barnSection ?? '—',
    sireTag: animal.sireTag ?? null,
    damTag: animal.damTag ?? null,
    photoUrl: animal.photoUrl ?? null,
    lastInseminationAt: animal.lastInseminationAt ?? null,
    expectedBirthAt: animal.expectedBirthAt ?? null,
    daysToBirth: animal.expectedBirthAt
      ? Math.max(0, Math.ceil((new Date(animal.expectedBirthAt).getTime() - Date.now()) / 86400000))
      : null,
    dailyMilkLiters: animal.dailyMilkLiters ?? 0,
    healthScore: animal.healthScore ?? 100,
    healthLabel: healthLabel(animal.healthScore),
    bodyTemperature: animal.bodyTemperature ?? null,
    ruminationMinutes: animal.ruminationMinutes ?? null,
    activityMinutes: animal.activityMinutes ?? null,
    lastVetCheckAt: animal.lastVetCheckAt ?? null,
    zoneName: animal.currentZone?.name ?? null,
    device: animal.device
      ? {
          id: String(animal.device._id ?? animal.device),
          label: animal.device.label ?? null,
          batteryLevel: animal.device.batteryLevel ?? null,
          status: animal.device.status ?? null,
          lastSeenAt: animal.device.lastSeenAt ?? null,
        }
      : null,
    lastSeenAt: animal.lastSeenAt ?? null,
  };
}

/**
 * GET /animals/view
 * Suru listesi ekraninin bicimlendirilmis satirlari (yas, durum, saglik
 * etiketleri sunucuda hesaplanir).
 */
export const listView = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm, isActive: true };
  for (const field of ['status', 'lactationStage', 'breed', 'barnSection']) {
    if (req.query[field]) filter[field] = String(req.query[field]).slice(0, 120);
  }
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.$or = [
      { earTag: { $regex: safe, $options: 'i' } },
      { name: { $regex: safe, $options: 'i' } },
      { breed: { $regex: safe, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Animal.find(filter)
      .sort({ earTag: 1 })
      .skip(skip)
      .limit(limit)
      .populate('currentZone', 'name')
      .populate('device', 'label batteryLevel status lastSeenAt')
      .lean(),
    Animal.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(presentAnimal),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

export default { summary, detail, listView, addHealthRecord, addMilkRecord, presentAnimal };
