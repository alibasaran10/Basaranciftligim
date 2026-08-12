import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Alert from './alert.model.js';
import {
  ALERT_STATUS,
  ALERT_SEVERITY,
  ALERT_SOURCE,
  ALERT_TYPE,
} from '../../common/constants.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';
import { hourlySeries, percentChange } from '../../common/utils/series.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

/** Arayuzde gosterilecek Turkce etiketler (tek kaynak). */
export const ALERT_TYPE_LABELS = Object.freeze({
  [ALERT_TYPE.LOW_BATTERY]: 'Düşük Pil Uyarısı',
  [ALERT_TYPE.ABNORMAL_MOTION]: 'Anormal Hareket',
  [ALERT_TYPE.DISEASE]: 'Hastalık Şüphesi',
  [ALERT_TYPE.ESTRUS]: 'Kızgınlık / Stres Alarmı',
  [ALERT_TYPE.ZONE_LEFT]: 'Bölge Dışına Çıktı',
  [ALERT_TYPE.DEVICE_OFFLINE]: 'Cihaz Çevrimdışı',
  [ALERT_TYPE.BIRTH_APPROACHING]: 'Doğum Yaklaşıyor',
  [ALERT_TYPE.TEMPERATURE]: 'Sıcaklık Uyarısı',
  [ALERT_TYPE.IRRIGATION]: 'Sulama Uyarısı',
  [ALERT_TYPE.CRITICAL_STOCK]: 'Kritik Stok',
  [ALERT_TYPE.CAMERA_OFFLINE]: 'Kamera Bağlantı Sorunu',
  [ALERT_TYPE.VACCINATION_DUE]: 'Aşılama Hatırlatması',
});

export const ALERT_SOURCE_LABELS = Object.freeze({
  [ALERT_SOURCE.HERD]: 'Sürü',
  [ALERT_SOURCE.FIELD]: 'Tarla',
  [ALERT_SOURCE.STOCK]: 'Stok',
  [ALERT_SOURCE.CAMERA]: 'Kamera',
  [ALERT_SOURCE.DEVICE]: 'Cihaz',
  [ALERT_SOURCE.SYSTEM]: 'Sistem',
});

export const ALERT_SEVERITY_LABELS = Object.freeze({
  [ALERT_SEVERITY.CRITICAL]: 'Kritik',
  [ALERT_SEVERITY.HIGH]: 'Yüksek',
  [ALERT_SEVERITY.MEDIUM]: 'Orta',
  [ALERT_SEVERITY.LOW]: 'Düşük',
  [ALERT_SEVERITY.WARNING]: 'Orta',
  [ALERT_SEVERITY.INFO]: 'Düşük',
});

export const ALERT_STATUS_LABELS = Object.freeze({
  [ALERT_STATUS.OPEN]: 'Aktif',
  [ALERT_STATUS.ACKNOWLEDGED]: 'İnceleniyor',
  [ALERT_STATUS.RESOLVED]: 'Çözüldü',
});

/** Ham alarm dokumanini arayuzun bekledigi duz nesneye cevirir. */
export function present(alert) {
  const subjectParts = [];
  if (alert.animal?.earTag) {
    subjectParts.push(alert.animal.earTag);
    if (alert.animal.breed) subjectParts.push(alert.animal.breed);
  } else if (alert.field?.name) {
    subjectParts.push(alert.field.name);
  } else if (alert.camera?.name) {
    subjectParts.push(alert.camera.name);
  } else if (alert.zone?.name) {
    subjectParts.push(alert.zone.name);
  }

  return {
    id: String(alert._id),
    type: alert.type,
    title: alert.title || ALERT_TYPE_LABELS[alert.type] || alert.type,
    source: alert.source,
    sourceLabel: ALERT_SOURCE_LABELS[alert.source] ?? 'Sistem',
    severity: alert.severity,
    severityLabel: ALERT_SEVERITY_LABELS[alert.severity] ?? 'Orta',
    status: alert.status,
    statusLabel: ALERT_STATUS_LABELS[alert.status] ?? 'Aktif',
    message: alert.message,
    subject: subjectParts.join(' · ') || alert.message,
    animal: alert.animal ? { id: String(alert.animal._id), earTag: alert.animal.earTag, breed: alert.animal.breed } : null,
    field: alert.field ? { id: String(alert.field._id), name: alert.field.name } : null,
    camera: alert.camera ? { id: String(alert.camera._id), name: alert.camera.name } : null,
    zone: alert.zone ? { id: String(alert.zone._id), name: alert.zone.name } : null,
    assignedLabel: alert.assignedLabel || alert.assignedTo?.name || '—',
    cameraVerified: !!alert.cameraVerified,
    imageUrl: alert.imageUrl || null,
    createdAt: alert.createdAt,
    acknowledgedAt: alert.acknowledgedAt ?? null,
    resolvedAt: alert.resolvedAt ?? null,
  };
}

/**
 * GET /alerts?status=&type=&source=&severity=&days=&q=&page=&limit=
 * Ciftlik-scope'lu, indeksli (farm+status+createdAt) listeleme.
 */
export const list = catchAsync(async (req, res) => {
  const { page, limit, skip } = parseOffsetPagination(req.query);
  const filter = { farm: req.auth.farmId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.days) {
    filter.createdAt = { $gte: new Date(Date.now() - Number(req.query.days) * 86400000) };
  }
  if (req.query.q) {
    // Regex ozel karakterleri kacisla etkisizlestirilir (ReDoS/enjeksiyon onlemi).
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.$or = [
      { message: { $regex: safe, $options: 'i' } },
      { title: { $regex: safe, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('animal', 'earTag name breed')
      .populate('zone', 'name')
      .populate('field', 'name')
      .populate('camera', 'name')
      .populate('assignedTo', 'name')
      .lean(),
    Alert.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(present),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

/**
 * GET /alerts/summary
 * Alarm ekranindaki ozet kartlari, oncelik dagilimi, kaynak kirilimi,
 * 24 saatlik trend ve one cikan alarm kartlari tek istekte.
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const last7Days = new Date(now.getTime() - 7 * 86400000);
  const prev7Days = new Date(now.getTime() - 14 * 86400000);
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    total,
    activeCritical,
    todayCount,
    yesterdayCount,
    resolvedCount,
    resolvedLastWeek,
    resolvedPrevWeek,
    cameraVerified,
    pendingAction,
    severityAgg,
    sourceAgg,
    hourlyAgg,
    highlights,
  ] = await Promise.all([
    Alert.countDocuments({ farm }),
    Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN, severity: ALERT_SEVERITY.CRITICAL }),
    Alert.countDocuments({ farm, createdAt: { $gte: startOfToday } }),
    Alert.countDocuments({ farm, createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
    Alert.countDocuments({ farm, status: ALERT_STATUS.RESOLVED }),
    // Degisim orani ayni uzunluktaki iki hafta karsilastirilarak bulunur.
    Alert.countDocuments({
      farm,
      status: ALERT_STATUS.RESOLVED,
      resolvedAt: { $gte: last7Days },
    }),
    Alert.countDocuments({
      farm,
      status: ALERT_STATUS.RESOLVED,
      resolvedAt: { $gte: prev7Days, $lt: last7Days },
    }),
    Alert.countDocuments({ farm, cameraVerified: true }),
    Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN }),
    Alert.aggregate([
      { $match: { farm } },
      { $group: { _id: '$severity', value: { $sum: 1 } } },
    ]),
    Alert.aggregate([
      { $match: { farm } },
      { $group: { _id: '$source', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
    Alert.aggregate([
      { $match: { farm, createdAt: { $gte: last24h } } },
      { $group: { _id: { $hour: '$createdAt' }, value: { $sum: 1 } } },
    ]),
    Alert.find({ farm, status: { $ne: ALERT_STATUS.RESOLVED } })
      .sort({ severity: 1, createdAt: -1 })
      .limit(3)
      .populate('animal', 'earTag name breed photoUrl')
      .populate('field', 'name imageUrl')
      .populate('camera', 'name')
      .populate('zone', 'name')
      .populate('assignedTo', 'name')
      .lean(),
  ]);

  const sevCount = (key) => severityAgg.find((s) => s._id === key)?.value ?? 0;

  return sendSuccess(res, {
    data: {
      totals: {
        total,
        activeCritical,
        today: todayCount,
        todayChangePercent: percentChange(todayCount, yesterdayCount),
        resolved: resolvedCount,
        resolvedChangePercent: percentChange(resolvedLastWeek, resolvedPrevWeek),
        cameraVerified,
        pendingAction,
      },
      severityDistribution: [
        { name: 'Kritik', value: sevCount(ALERT_SEVERITY.CRITICAL) },
        { name: 'Yüksek', value: sevCount(ALERT_SEVERITY.HIGH) },
        { name: 'Orta', value: sevCount(ALERT_SEVERITY.MEDIUM) + sevCount(ALERT_SEVERITY.WARNING) },
        { name: 'Düşük', value: sevCount(ALERT_SEVERITY.LOW) + sevCount(ALERT_SEVERITY.INFO) },
      ],
      sourceDistribution: sourceAgg.map((s) => ({
        name: ALERT_SOURCE_LABELS[s._id] ?? 'Sistem',
        value: s.value,
      })),
      trend24h: hourlySeries(hourlyAgg, 4, ['value']),
      highlights: highlights.map(present),
    },
  });
});

/** Alarmi "goruldu" olarak isaretle. */
export const acknowledge = catchAsync(async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.id, farm: req.auth.farmId, status: ALERT_STATUS.OPEN },
    { $set: { status: ALERT_STATUS.ACKNOWLEDGED, acknowledgedBy: req.auth.userId, acknowledgedAt: new Date() } },
    { new: true }
  );
  if (!alert) throw ApiError.notFound('Acik alarm bulunamadi');
  return sendSuccess(res, { data: alert, message: 'Alarm goruldu olarak isaretlendi' });
});

/** Alarmi "cozuldu" olarak isaretle. */
export const resolve = catchAsync(async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.id, farm: req.auth.farmId, status: { $ne: ALERT_STATUS.RESOLVED } },
    { $set: { status: ALERT_STATUS.RESOLVED, resolvedAt: new Date() } },
    { new: true }
  );
  if (!alert) throw ApiError.notFound('Alarm bulunamadi veya zaten cozulmus');
  return sendSuccess(res, { data: alert, message: 'Alarm cozuldu' });
});

export default { list, summary, acknowledge, resolve, present };
