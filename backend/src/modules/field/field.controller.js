import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Field from './field.model.js';
import CropRecord from '../crop/cropRecord.model.js';
import Alert from '../alert/alert.model.js';
import {
  IRRIGATION_STATUS,
  ALERT_STATUS,
  ALERT_SOURCE,
  CROP_RECORD_TYPE,
} from '../../common/constants.js';
import { monthlySeries } from '../../common/utils/series.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';
import { slugifyTr } from '../../common/utils/slug.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

/**
 * Tarlaya islem/verim kaydi ekler (suruldu, bicildi, hasat, balya vb.).
 * $push ile atomik ekleme; tarla yalnizca kendi ciftligindeyse.
 */
export const addOperation = catchAsync(async (req, res) => {
  const operation = {
    ...req.body,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    recordedBy: req.auth.userId,
  };

  const field = await Field.findOneAndUpdate(
    { _id: req.params.id, farm: req.auth.farmId },
    { $push: { operations: operation } },
    { new: true, runValidators: true }
  );
  if (!field) throw ApiError.notFound('Tarla bulunamadi');

  return sendSuccess(res, { data: field, message: 'Islem kaydedildi' });
});

/**
 * Bir tarlanin islem gecmisini (verim ozeti) doner.
 */
export const listOperations = catchAsync(async (req, res) => {
  const field = await Field.findOne({ _id: req.params.id, farm: req.auth.farmId })
    .select('name operations')
    .lean();
  if (!field) throw ApiError.notFound('Tarla bulunamadi');

  const operations = [...(field.operations || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sendSuccess(res, { data: { fieldId: String(field._id), name: field.name, operations } });
});

/**
 * GET /fields/summary
 * Tarla yonetimi ekranindaki kartlar, urun/sulama dagilimlari, verim trendi
 * ve kritik sulama uyarisi.
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [totals, cropAgg, irrigationAgg, yieldAgg, criticalField, criticalAlerts, recentRecords, nearHarvest] =
    await Promise.all([
      Field.aggregate([
        { $match: { farm, isActive: true } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            areaDonum: { $sum: { $ifNull: ['$areaDonum', 0] } },
            activeSowing: { $sum: { $cond: [{ $ifNull: ['$crop', false] }, 1, 0] } },
            activeIrrigation: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$irrigation.status',
                      [IRRIGATION_STATUS.GOOD, IRRIGATION_STATUS.MEDIUM],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Field.aggregate([
        { $match: { farm, isActive: true, crop: { $nin: [null, ''] } } },
        { $group: { _id: '$crop', value: { $sum: { $ifNull: ['$areaDonum', 0] } } } },
        { $sort: { value: -1 } },
      ]),
      Field.aggregate([
        { $match: { farm, isActive: true } },
        {
          $group: {
            _id: { $ifNull: ['$irrigation.status', IRRIGATION_STATUS.NONE] },
            value: { $sum: 1 },
          },
        },
      ]),
      // Hasat kayitlarindan aylik verim trendi.
      CropRecord.aggregate([
        { $match: { farm, type: CROP_RECORD_TYPE.HARVEST } },
        {
          $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: { $ifNull: ['$amount', 0] } },
          },
        },
      ]),
      Field.findOne({ farm, isActive: true, 'irrigation.moisturePercent': { $lte: 25 } })
        .sort({ 'irrigation.moisturePercent': 1 })
        .select('name irrigation imageUrl')
        .lean(),
      Alert.countDocuments({ farm, status: ALERT_STATUS.OPEN, source: ALERT_SOURCE.FIELD }),
      CropRecord.find({ farm }).populate('field', 'name').sort({ date: -1 }).limit(3).lean(),
      Field.countDocuments({
        farm,
        isActive: true,
        expectedHarvestDate: { $gte: now, $lte: in30Days },
      }),
    ]);

  const base = totals[0] ?? { count: 0, areaDonum: 0, activeSowing: 0, activeIrrigation: 0 };

  const irrigationLabels = {
    [IRRIGATION_STATUS.GOOD]: 'İyi',
    [IRRIGATION_STATUS.MEDIUM]: 'Orta',
    [IRRIGATION_STATUS.POOR]: 'Kötü',
    [IRRIGATION_STATUS.NONE]: 'Planlanmadı',
  };

  const goodCount = irrigationAgg.find((i) => i._id === IRRIGATION_STATUS.GOOD)?.value ?? 0;

  return sendSuccess(res, {
    data: {
      totals: {
        fields: base.count,
        areaDonum: Math.round(base.areaDonum),
        activeSowing: base.activeSowing,
        nearHarvest,
        activeIrrigation: base.activeIrrigation,
        criticalAlerts,
      },
      cropDistribution: cropAgg.map((c) => ({ name: c._id, value: Math.round(c.value) })),
      irrigationDistribution: Object.values(IRRIGATION_STATUS).map((status) => ({
        name: irrigationLabels[status],
        value: irrigationAgg.find((i) => i._id === status)?.value ?? 0,
      })),
      irrigationHealthPercent: base.count ? Math.round((goodCount / base.count) * 100) : 0,
      yieldTrend: monthlySeries(yieldAgg).map((p) => ({ name: p.name, value: Math.round(p.total) })),
      criticalField,
      recentRecords: recentRecords.map((r) => ({
        id: String(r._id),
        type: r.type,
        crop: r.crop,
        fieldName: r.field?.name ?? '—',
        date: r.date,
        amount: r.amount,
        unit: r.unit,
      })),
    },
  });
});

/** Tarla detayinin ortak govdesi (id ve slug uclari ayni yaniti verir). */
async function buildFieldDetail(farm, field) {
  const records = await CropRecord.find({ farm, field: field._id }).sort({ date: -1 }).lean();
  const operations = [...(field.operations || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const expected = field.expectedYieldPerDonum ?? 0;
  const actual = field.actualYieldPerDonum ?? 0;

  return {
    field,
    records,
    operations,
    yieldSummary: {
      expectedPerDonum: expected,
      actualPerDonum: actual,
      totalYield: Math.round(actual * (field.areaDonum ?? 0)),
      unit: field.yieldUnit ?? 'Ton',
      achievementPercent: expected ? Math.round((actual / expected) * 100) : 0,
    },
  };
}

/**
 * GET /fields/by-slug/:slug
 * Web tarafi tarla detayina okunabilir URL ile gider ("/tarlalar/kuzey-tarlasi").
 * Slug sema uzerinde sanal alan olarak uretildigi icin burada eslestirilir.
 */
export const getBySlug = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  // Slug indekslenebilir bir alan degil; ad uzerinden hesaplanip eslenir.
  const fields = await Field.find({ farm }).lean();
  const field = fields.find((f) => slugifyTr(f.name) === req.params.slug);
  if (!field) throw ApiError.notFound('Tarla bulunamadi');

  return sendSuccess(res, { data: await buildFieldDetail(farm, field) });
});

/** GET /fields/:id/detail — tarla detay ekraninin tum bloklari. */
export const detail = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const field = await Field.findOne({ _id: req.params.id, farm }).lean();
  if (!field) throw ApiError.notFound('Tarla bulunamadi');

  return sendSuccess(res, { data: await buildFieldDetail(farm, field) });
});

const IRRIGATION_LABELS = Object.freeze({
  [IRRIGATION_STATUS.GOOD]: 'İyi',
  [IRRIGATION_STATUS.MEDIUM]: 'Orta',
  [IRRIGATION_STATUS.POOR]: 'Kötü',
  [IRRIGATION_STATUS.NONE]: 'Planlanmadı',
});

/**
 * Tarla dokumanini liste satirina cevirir. Sulama kolonu tasarimda
 * "İyi · %75" bicimindedir; bu birlesik metin burada uretilir.
 */
export function presentField(field) {
  const status = field.irrigation?.status ?? IRRIGATION_STATUS.NONE;
  const moisture = field.irrigation?.moisturePercent;
  const statusLabel = IRRIGATION_LABELS[status] ?? 'Planlanmadı';

  return {
    id: String(field._id),
    slug: slugifyTr(field.name),
    name: field.name,
    code: field.code ?? '',
    crop: field.crop ?? '—',
    cropVariety: field.cropVariety ?? '',
    soilType: field.soilType ?? '—',
    areaDonum: field.areaDonum ?? 0,
    areaHectares: field.areaHectares ?? null,
    imageUrl: field.imageUrl ?? null,
    growthStage: field.growthStage ?? '—',
    sowingDate: field.sowingDate ?? null,
    expectedHarvestDate: field.expectedHarvestDate ?? null,
    irrigation: {
      method: field.irrigation?.method ?? '—',
      status,
      statusLabel,
      moisturePercent: moisture ?? null,
      label: moisture === undefined || moisture === null ? statusLabel : `${statusLabel} · %${moisture}`,
      lastIrrigatedAt: field.irrigation?.lastIrrigatedAt ?? null,
    },
    altitudeMeters: field.altitudeMeters ?? null,
    slopePercent: field.slopePercent ?? null,
    locality: field.locality ?? '',
    expectedYieldPerDonum: field.expectedYieldPerDonum ?? 0,
    actualYieldPerDonum: field.actualYieldPerDonum ?? 0,
    yieldUnit: field.yieldUnit ?? 'Ton',
    notes: field.notes ?? '',
    createdAt: field.createdAt,
    updatedAt: field.updatedAt,
  };
}

/** GET /fields/view — bicimlendirilmis tarla listesi. */
export const listView = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm, isActive: true };
  if (req.query.crop) filter.crop = String(req.query.crop).slice(0, 80);
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { code: { $regex: safe, $options: 'i' } },
      { crop: { $regex: safe, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Field.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Field.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(presentField),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

export default {
  addOperation,
  listOperations,
  summary,
  getBySlug,
  detail,
  listView,
  presentField,
};
