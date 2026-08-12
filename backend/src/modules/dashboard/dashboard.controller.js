import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Animal from '../animal/animal.model.js';
import Device from '../device/device.model.js';
import Alert from '../alert/alert.model.js';
import Field from '../field/field.model.js';
import Farm from '../farm/farm.model.js';
import Camera from '../camera/camera.model.js';
import StockItem from '../stock/stockItem.model.js';
import CropRecord from '../crop/cropRecord.model.js';
import CalendarEvent from '../event/event.model.js';
import { env } from '../../config/env.js';
import {
  ALERT_STATUS,
  ALERT_SEVERITY,
  LACTATION_STAGE,
  CROP_RECORD_TYPE,
} from '../../common/constants.js';
import { dailySeries, monthlySeries, percentChange } from '../../common/utils/series.js';

/** Tarih gruplamalarinda kullanilan ciftlik saat dilimi. */
const FARM_TIMEZONE = 'Europe/Istanbul';
import { present as presentAlert } from '../alert/alert.controller.js';
import { slugifyTr } from '../../common/utils/slug.js';

function farmObjectId(req) {
  const farmIdStr = req.auth?.farmId;
  if (!farmIdStr) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmIdStr);
}

/**
 * GET /dashboard/summary
 * Gosterge panelinin ozet metrikleri. Her metrik indeksli sorgularla
 * paralel calisir; agir tarama yapilmaz. (Cihaz/bolge odakli teknik ozet.)
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);

  // Cevrimdisi esigi: son 45 dk icinde gorulmeyen cihazlar (15dk periyot x3).
  const offlineThreshold = new Date(Date.now() - 45 * 60 * 1000);

  const [
    totalAnimals,
    activeDevices,
    lowBatteryDevices,
    offlineDevices,
    openAlerts,
    zoneDistribution,
  ] = await Promise.all([
    Animal.countDocuments({ farm, isActive: true }),
    Device.countDocuments({ farm }),
    Device.countDocuments({ farm, batteryLevel: { $lte: env.LOW_BATTERY_THRESHOLD } }),
    Device.countDocuments({ farm, lastSeenAt: { $lt: offlineThreshold } }),
    Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN }),
    // Bolgeye gore hayvan dagilimi (canli izleme haritasi icin).
    Animal.aggregate([
      { $match: { farm, isActive: true, currentZone: { $ne: null } } },
      { $group: { _id: '$currentZone', count: { $sum: 1 } } },
      { $lookup: { from: 'zones', localField: '_id', foreignField: '_id', as: 'zone' } },
      { $unwind: { path: '$zone', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, zoneId: '$_id', zoneName: '$zone.name', count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return sendSuccess(res, {
    data: {
      totals: {
        animals: totalAnimals,
        devices: activeDevices,
        lowBatteryDevices,
        offlineDevices,
        openAlerts,
      },
      zoneDistribution,
    },
  });
});

/**
 * GET /dashboard/overview
 * Web dashboard'unun ve mobil ana ekranin TAMAMINI tek istekte besler:
 * ozet kartlari, sut/verim trendleri, dagilim grafikleri, tarlalar,
 * son hasatlar, aktivite akisi, son alarmlar, kamera onizleme ve hava durumu.
 */
export const overview = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const year = now.getFullYear();
  const in15Days = new Date(now.getTime() + 15 * 86400000);
  const last30Days = new Date(now.getTime() - 30 * 86400000);
  const prev30Days = new Date(now.getTime() - 60 * 86400000);

  const [
    stageAgg,
    healthBuckets,
    fieldCount,
    stockItems,
    openAlerts,
    criticalAlerts,
    upcomingBirths,
    milkAgg,
    milkTotals,
    yieldAgg,
    yieldTotals,
    fields,
    recentHarvests,
    recentAlerts,
    camera,
    farmDoc,
    todayEvents,
  ] = await Promise.all([
    Animal.aggregate([
      { $match: { farm, isActive: true } },
      { $group: { _id: '$lactationStage', count: { $sum: 1 } } },
    ]),
    Animal.aggregate([
      { $match: { farm, isActive: true } },
      {
        $bucket: {
          groupBy: { $ifNull: ['$healthScore', 100] },
          boundaries: [0, 70, 85, 101],
          default: 101,
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    Field.countDocuments({ farm, isActive: true }),
    StockItem.find({ farm, isActive: true }).select('name quantity unit').lean(),
    Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN }),
    Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN, severity: ALERT_SEVERITY.CRITICAL }),
    Animal.countDocuments({ farm, isActive: true, expectedBirthAt: { $gte: now, $lte: in15Days } }),
    // Gunluk sut serisi (son 30 gun).
    Animal.aggregate([
      { $match: { farm, isActive: true } },
      { $unwind: '$milkRecords' },
      { $match: { 'milkRecords.date': { $gte: last30Days } } },
      {
        $group: {
          // Ciftligin saat dilimiyle grupla; aksi halde gece yarisi kayitlari
          // bir onceki gune duser ve gunluk seride bosluk olusur.
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$milkRecords.date',
              timezone: FARM_TIMEZONE,
            },
          },
          total: { $sum: '$milkRecords.liters' },
        },
      },
    ]),
    // Son 30 gun ve onceki 30 gun sut toplamlari (KPI degisimi).
    Animal.aggregate([
      { $match: { farm, isActive: true } },
      { $unwind: '$milkRecords' },
      { $match: { 'milkRecords.date': { $gte: prev30Days } } },
      {
        $group: {
          _id: { $gte: ['$milkRecords.date', last30Days] },
          total: { $sum: '$milkRecords.liters' },
        },
      },
    ]),
    CropRecord.aggregate([
      { $match: { farm, type: CROP_RECORD_TYPE.HARVEST } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
    ]),
    CropRecord.aggregate([
      { $match: { farm, type: CROP_RECORD_TYPE.HARVEST } },
      {
        $group: {
          _id: { $year: '$date' },
          total: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
    ]),
    Field.find({ farm, isActive: true })
      .select('name code crop soilType areaDonum imageUrl')
      .sort({ areaDonum: -1 })
      .limit(3)
      .lean(),
    CropRecord.find({ farm, type: CROP_RECORD_TYPE.HARVEST })
      .sort({ date: -1 })
      .limit(3)
      .populate('field', 'name')
      .lean(),
    Alert.find({ farm, status: { $ne: ALERT_STATUS.RESOLVED } })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('animal', 'earTag breed')
      .populate('field', 'name')
      .populate('camera', 'name')
      .populate('zone', 'name')
      .lean(),
    Camera.findOne({ farm, isActive: true }).sort({ createdAt: 1 }).lean(),
    Farm.findById(farm).select('name weather mapImageUrl').lean(),
    CalendarEvent.countDocuments({
      farm,
      startAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      },
    }),
  ]);

  const stage = Object.fromEntries(stageAgg.map((s) => [s._id, s.count]));
  const totalAnimals = stageAgg.reduce((acc, s) => acc + s.count, 0);
  const milking = stage[LACTATION_STAGE.MILKING] ?? 0;
  const dry = stage[LACTATION_STAGE.DRY] ?? 0;
  const calves = stage[LACTATION_STAGE.CALF] ?? 0;

  const bucketCount = (boundary) => healthBuckets.find((b) => b._id === boundary)?.count ?? 0;

  const totalStock = stockItems
    .filter((i) => (i.unit || '').toLocaleLowerCase('tr-TR').startsWith('ton'))
    .reduce((acc, i) => acc + Number(i.quantity || 0), 0);

  const milkCurrent = milkTotals.find((m) => m._id === true)?.total ?? 0;
  const milkPrevious = milkTotals.find((m) => m._id === false)?.total ?? 0;

  const yieldCurrent = yieldTotals.find((y) => y._id === year)?.total ?? 0;
  const yieldPrevious = yieldTotals.find((y) => y._id === year - 1)?.total ?? 0;

  const percent = (value) => (totalAnimals ? Math.round((value / totalAnimals) * 1000) / 10 : 0);

  return sendSuccess(res, {
    data: {
      farmName: farmDoc?.name ?? '',
      totals: {
        animals: totalAnimals,
        milking,
        milkingPercent: percent(milking),
        dry,
        dryPercent: percent(dry),
        calves,
        calvesPercent: percent(calves),
        fields: fieldCount,
        stockQuantity: Math.round(totalStock * 10) / 10,
        stockUnit: 'Ton',
        openAlerts,
        criticalAlerts,
        upcomingBirths,
        todayEvents,
      },
      milk: {
        total: Math.round(milkCurrent),
        changePercent: percentChange(milkCurrent, milkPrevious),
        series: dailySeries(milkAgg, 30).map((p) => ({
          name: p.name,
          value: Math.round(p.total),
        })),
      },
      fieldYield: {
        total: Math.round(yieldCurrent),
        changePercent: percentChange(yieldCurrent, yieldPrevious),
        series: monthlySeries(yieldAgg, year).map((p) => ({
          name: p.name,
          value: Math.round(p.total),
        })),
      },
      stockDistribution: stockItems
        .slice()
        .sort((a, b) => Number(b.quantity) - Number(a.quantity))
        .slice(0, 5)
        .map((i) => ({ name: i.name, value: Number(i.quantity) })),
      herdHealth: [
        { name: 'Sağlıklı', value: bucketCount(85) },
        { name: 'İzlemede', value: bucketCount(70) },
        { name: 'Tedavi', value: bucketCount(0) },
      ],
      fields: fields.map((f) => ({
        id: String(f._id),
        slug: slugifyTr(f.name),
        name: f.name,
        code: f.code ?? '',
        crop: f.crop ?? '—',
        soilType: f.soilType ?? '',
        areaDonum: f.areaDonum ?? 0,
        imageUrl: f.imageUrl ?? null,
      })),
      recentHarvests: recentHarvests.map((r) => ({
        id: String(r._id),
        crop: r.crop,
        fieldName: r.field?.name ?? '—',
        amount: r.amount,
        unit: r.unit,
        date: r.date,
      })),
      recentAlerts: recentAlerts.map(presentAlert),
      camera: camera
        ? {
            id: String(camera._id),
            name: camera.name,
            snapshotUrl: camera.snapshotUrl ?? null,
            isRecording: !!camera.isRecording,
          }
        : null,
      weather: farmDoc?.weather ?? null,
      mapImageUrl: farmDoc?.mapImageUrl ?? null,
    },
  });
});

/**
 * GET /dashboard/activity
 * "Aktivite Akisi" paneli: alarmlar, hasat kayitlari ve takvim etkinlikleri
 * birlestirilip zamana gore siralanir.
 */
export const activity = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const [alerts, harvests, events] = await Promise.all([
    Alert.find({ farm }).sort({ createdAt: -1 }).limit(limit).populate('animal', 'earTag').lean(),
    CropRecord.find({ farm }).sort({ date: -1 }).limit(limit).populate('field', 'name').lean(),
    CalendarEvent.find({ farm }).sort({ startAt: -1 }).limit(limit).lean(),
  ]);

  const items = [
    ...alerts.map((a) => ({
      id: String(a._id),
      kind: 'alert',
      tone: a.severity === ALERT_SEVERITY.CRITICAL ? 'red' : 'orange',
      text: a.animal?.earTag
        ? `${a.animal.earTag} için ${a.title || a.type} oluşturuldu.`
        : a.message,
      at: a.createdAt,
    })),
    ...harvests.map((h) => ({
      id: String(h._id),
      kind: 'crop',
      tone: 'green',
      text: `${h.field?.name ?? 'Tarla'} için ${h.crop} ${
        h.type === CROP_RECORD_TYPE.HARVEST ? 'hasat' : 'ekim'
      } kaydı eklendi.`,
      at: h.date,
    })),
    ...events.map((e) => ({
      id: String(e._id),
      kind: 'event',
      tone: 'purple',
      text: `${e.title}${e.location ? ` · ${e.location}` : ''}`,
      at: e.startAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);

  return sendSuccess(res, { data: items });
});

export default { summary, overview, activity };
