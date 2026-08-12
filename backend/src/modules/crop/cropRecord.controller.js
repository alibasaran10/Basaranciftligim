import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import CropRecord from './cropRecord.model.js';
import { CROP_RECORD_TYPE, CROP_RECORD_STATUS } from '../../common/constants.js';
import { monthlySeries, percentChange } from '../../common/utils/series.js';
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
 * GET /crop-records/summary?type=ekim|hasat
 * Ekim & Hasat ekranindaki dort ozet karti, aylik alan grafigi ve urun
 * dagilimi. Tur verilmezse ekim kayitlari esas alinir (varsayilan sekme).
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const type = req.query.type || CROP_RECORD_TYPE.SOWING;
  const year = new Date().getFullYear();
  const match = { farm, type };

  const [totals, seasonTotals, yieldByYear, monthlyAgg, cropAgg] = await Promise.all([
    CropRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          area: { $sum: '$areaDonum' },
          cost: { $sum: '$cost' },
          revenue: { $sum: '$revenue' },
          yieldSum: { $sum: { $ifNull: ['$yieldPerDonum', 0] } },
          yieldCount: { $sum: { $cond: [{ $gt: ['$yieldPerDonum', 0] }, 1, 0] } },
        },
      },
    ]),
    CropRecord.aggregate([
      {
        $match: {
          ...match,
          date: { $gte: new Date(`${year}-01-01T00:00:00.000Z`) },
        },
      },
      {
        $group: {
          _id: null,
          area: { $sum: '$areaDonum' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', CROP_RECORD_STATUS.COMPLETED] }, 1, 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    // Verim yalnizca HASAT kayitlarinda olusur. "Ortalama Verim" karti hangi
    // sekme acik olursa olsun hasattan hesaplanir; aksi halde ekim sekmesinde
    // her zaman 0 gorunurdu.
    CropRecord.aggregate([
      {
        $match: {
          farm,
          type: CROP_RECORD_TYPE.HARVEST,
          yieldPerDonum: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: { $year: '$date' },
          yieldSum: { $sum: '$yieldPerDonum' },
          yieldCount: { $sum: 1 },
        },
      },
    ]),
    CropRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: '$areaDonum' },
          secondary: { $sum: '$amount' },
        },
      },
    ]),
    CropRecord.aggregate([
      { $match: match },
      { $group: { _id: '$crop', value: { $sum: '$areaDonum' } } },
      { $sort: { value: -1 } },
    ]),
  ]);

  const base = totals[0] ?? { count: 0, area: 0, cost: 0, revenue: 0 };
  const season = seasonTotals[0] ?? { area: 0, completed: 0, count: 0 };

  const yieldOf = (y) => {
    const row = yieldByYear.find((r) => r._id === y);
    return row?.yieldCount ? row.yieldSum / row.yieldCount : 0;
  };
  const avgYield = yieldOf(year);
  const prevAvgYield = yieldOf(year - 1);

  return sendSuccess(res, {
    data: {
      type,
      totals: {
        records: base.count,
        totalArea: Math.round(base.area * 10) / 10,
        seasonArea: Math.round(season.area * 10) / 10,
        seasonCompletionPercent: base.area
          ? Math.round((season.area / base.area) * 1000) / 10
          : 0,
        totalCost: Math.round(base.cost),
        totalRevenue: Math.round(base.revenue),
        costPerDonum: base.area ? Math.round(base.cost / base.area) : 0,
        averageYield: Math.round(avgYield),
        yieldChangePercent: percentChange(avgYield, prevAvgYield),
      },
      monthlyArea: monthlySeries(monthlyAgg, year, ['total', 'secondary']).map((p) => ({
        name: p.name,
        value: Math.round(p.total),
        secondary: Math.round(p.secondary),
      })),
      cropDistribution: cropAgg.map((c) => ({
        name: c._id,
        value: Math.round(c.value * 10) / 10,
      })),
    },
  });
});

export const STATUS_LABELS = Object.freeze({
  [CROP_RECORD_STATUS.PLANNED]: 'Planlandı',
  [CROP_RECORD_STATUS.IN_PROGRESS]: 'Devam Ediyor',
  [CROP_RECORD_STATUS.COMPLETED]: 'Tamamlandı',
});

const TYPE_LABELS = Object.freeze({
  [CROP_RECORD_TYPE.SOWING]: 'Ekim',
  [CROP_RECORD_TYPE.HARVEST]: 'Hasat',
});

/** Ekim/hasat kaydini liste satirina cevirir. */
export function presentRecord(record) {
  return {
    id: String(record._id),
    type: record.type,
    typeLabel: TYPE_LABELS[record.type] ?? record.type,
    date: record.date,
    fieldId: record.field ? String(record.field._id ?? record.field) : null,
    fieldName: record.field?.name ?? '—',
    fieldSlug: record.field?.name ? slugifyTr(record.field.name) : null,
    crop: record.crop,
    variety: record.variety ?? '—',
    areaDonum: record.areaDonum ?? 0,
    amount: record.amount ?? 0,
    unit: record.unit ?? 'kg/da',
    method: record.method ?? '—',
    cost: record.cost ?? 0,
    revenue: record.revenue ?? 0,
    yieldPerDonum: record.yieldPerDonum ?? null,
    status: record.status,
    statusLabel: STATUS_LABELS[record.status] ?? 'Planlandı',
    season: record.season ?? '',
    notes: record.notes ?? '',
  };
}

/** GET /crop-records/view — bicimlendirilmis ekim/hasat listesi. */
export const listView = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm };
  for (const field of ['type', 'status', 'crop']) {
    if (req.query[field]) filter[field] = String(req.query[field]).slice(0, 80);
  }
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.$or = [
      { crop: { $regex: safe, $options: 'i' } },
      { variety: { $regex: safe, $options: 'i' } },
      { method: { $regex: safe, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    CropRecord.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('field', 'name code')
      .lean(),
    CropRecord.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(presentRecord),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

export default { summary, listView, presentRecord };
