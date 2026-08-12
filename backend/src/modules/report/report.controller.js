import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Report from './report.model.js';
import { REPORT_CATEGORY } from '../../common/constants.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';
import { monthlySeries, percentChange } from '../../common/utils/series.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

export const CATEGORY_LABELS = Object.freeze({
  [REPORT_CATEGORY.HERD]: 'Sürü Performansı',
  [REPORT_CATEGORY.FIELD]: 'Tarla & Verim',
  [REPORT_CATEGORY.STOCK]: 'Stok Hareketleri',
  [REPORT_CATEGORY.FINANCE]: 'Finansal Analiz',
  [REPORT_CATEGORY.CAMERA]: 'Kamera Olayları',
  [REPORT_CATEGORY.SYSTEM]: 'Sistem',
});

function present(report) {
  return {
    id: String(report._id),
    title: report.title,
    category: report.category,
    categoryLabel: CATEGORY_LABELS[report.category] ?? 'Sistem',
    format: report.format,
    generatedAt: report.generatedAt,
    generatedBy: report.generatedByName || report.generatedBy?.name || '—',
    isScheduled: !!report.isScheduled,
    scheduleLabel: report.scheduleLabel ?? null,
    downloadCount: report.downloadCount ?? 0,
    fileUrl: report.fileUrl ?? null,
  };
}

/** GET /reports */
export const list = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.title = { $regex: safe, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Report.find(filter)
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('generatedBy', 'name')
      .lean(),
    Report.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(present),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

/**
 * GET /reports/summary
 * Raporlar ekranindaki kartlar, aylik aktivite grafigi, kategori kirilimi
 * ve son raporlar listesi.
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const year = now.getFullYear();
  const monthStart = new Date(year, now.getMonth(), 1);
  const prevMonthStart = new Date(year, now.getMonth() - 1, 1);

  const [total, thisMonth, prevMonth, scheduled, exportsAgg, monthlyAgg, categoryAgg, recent] =
    await Promise.all([
      Report.countDocuments({ farm }),
      Report.countDocuments({ farm, generatedAt: { $gte: monthStart } }),
      Report.countDocuments({ farm, generatedAt: { $gte: prevMonthStart, $lt: monthStart } }),
      Report.countDocuments({ farm, isScheduled: true }),
      Report.aggregate([
        { $match: { farm } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$downloadCount', 0] } } } },
      ]),
      Report.aggregate([
        { $match: { farm } },
        {
          $group: {
            _id: { y: { $year: '$generatedAt' }, m: { $month: '$generatedAt' } },
            total: { $sum: 1 },
          },
        },
      ]),
      Report.aggregate([
        { $match: { farm } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.find({ farm })
        .sort({ generatedAt: -1 })
        .limit(5)
        .populate('generatedBy', 'name')
        .lean(),
    ]);

  return sendSuccess(res, {
    data: {
      totals: {
        total,
        categories: categoryAgg.length,
        thisMonth,
        thisMonthChangePercent: percentChange(thisMonth, prevMonth),
        scheduled,
        exports: exportsAgg[0]?.total ?? 0,
      },
      monthlyActivity: monthlySeries(monthlyAgg, year).map((p) => ({
        name: p.name,
        value: Math.round(p.total),
      })),
      categories: Object.values(REPORT_CATEGORY).map((key) => ({
        category: key,
        name: CATEGORY_LABELS[key],
        count: categoryAgg.find((c) => c._id === key)?.count ?? 0,
      })),
      recent: recent.map(present),
    },
  });
});

/** POST /reports — yeni rapor kaydi (dosya uretimi ayri servis/kuyruk isi). */
export const create = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const report = await Report.create({
    ...req.body,
    farm,
    generatedBy: req.auth.userId,
    generatedByName: req.user?.name,
    generatedAt: new Date(),
  });
  return sendCreated(res, { data: present(report.toObject()), message: 'Rapor olusturuldu' });
});

/** POST /reports/:id/download — indirme sayacini artirir. */
export const registerDownload = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const report = await Report.findOneAndUpdate(
    { _id: req.params.id, farm },
    { $inc: { downloadCount: 1 } },
    { new: true }
  ).lean();
  if (!report) throw ApiError.notFound('Rapor bulunamadi');
  return sendSuccess(res, { data: present(report) });
});

/** DELETE /reports/:id */
export const remove = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const report = await Report.findOneAndDelete({ _id: req.params.id, farm });
  if (!report) throw ApiError.notFound('Rapor bulunamadi');
  return sendSuccess(res, { message: 'Silindi' });
});

export default { list, summary, create, registerDownload, remove };
