import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import StockItem from './stockItem.model.js';
import StockMovement from './stockMovement.model.js';
import {
  STOCK_CATEGORY,
  STOCK_LEVEL,
  STOCK_MOVEMENT,
} from '../../common/constants.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';
import { monthlySeries } from '../../common/utils/series.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

export const CATEGORY_LABELS = Object.freeze({
  [STOCK_CATEGORY.FEED_CROP]: 'Yem Bitkisi',
  [STOCK_CATEGORY.SILAGE]: 'Silaj',
  [STOCK_CATEGORY.HAY]: 'Kuru Ot',
  [STOCK_CATEGORY.GRAIN]: 'Tahıl',
  [STOCK_CATEGORY.CONCENTRATE]: 'Yem',
  [STOCK_CATEGORY.FERTILIZER]: 'Gübre',
  [STOCK_CATEGORY.SEED]: 'Tohum',
  [STOCK_CATEGORY.MEDICINE]: 'İlaç',
  [STOCK_CATEGORY.FUEL]: 'Yakıt',
  [STOCK_CATEGORY.OTHER]: 'Diğer',
});

export const LEVEL_LABELS = Object.freeze({
  [STOCK_LEVEL.SUFFICIENT]: 'Yeterli',
  [STOCK_LEVEL.MEDIUM]: 'Orta',
  [STOCK_LEVEL.CRITICAL]: 'Kritik',
});

const MOVEMENT_LABELS = Object.freeze({
  [STOCK_MOVEMENT.IN]: 'Stok Girişi',
  [STOCK_MOVEMENT.OUT]: 'Stok Çıkışı',
  [STOCK_MOVEMENT.ADJUSTMENT]: 'Stok Düzeltme',
});

/** Turkce sayi bicimi (ondalik ayraci virgul) — "0,6" gibi. */
function trNumber(value) {
  return Number(value ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}

/** Stok kalemini arayuz satirina cevirir. */
function present(item) {
  const min = Number(item.minLevel) || 0;
  const ratio = min > 0 ? Number(item.quantity) / min : Infinity;
  const level =
    ratio >= 1 ? STOCK_LEVEL.SUFFICIENT : ratio >= 0.6 ? STOCK_LEVEL.MEDIUM : STOCK_LEVEL.CRITICAL;
  const capacity = Number(item.capacity) || 0;

  return {
    id: String(item._id),
    name: item.name,
    category: item.category,
    categoryLabel: CATEGORY_LABELS[item.category] ?? 'Diğer',
    warehouse: item.warehouse || '—',
    quantity: item.quantity,
    unit: item.unit,
    minLevel: item.minLevel,
    capacity: item.capacity ?? null,
    fillPercent: capacity ? Math.min(100, Math.round((Number(item.quantity) / capacity) * 100)) : null,
    unitPrice: item.unitPrice ?? 0,
    totalValue: Math.round((Number(item.unitPrice) || 0) * Number(item.quantity)),
    lastIn: item.lastInAmount ? `+${trNumber(item.lastInAmount)} ${item.unit}` : '—',
    lastInAt: item.lastInAt ?? null,
    lastOut: item.lastOutAmount ? `-${trNumber(item.lastOutAmount)} ${item.unit}` : '—',
    lastOutAt: item.lastOutAt ?? null,
    level,
    levelLabel: LEVEL_LABELS[level],
  };
}

/** GET /stock — stok kalemleri listesi (arama + kategori/depo filtresi). */
export const list = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm, isActive: true };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.warehouse) filter.warehouse = String(req.query.warehouse).slice(0, 120);
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
    filter.name = { $regex: safe, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    StockItem.find(filter).sort({ quantity: -1 }).skip(skip).limit(limit).lean(),
    StockItem.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map(present),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

/** GET /stock/:id */
export const getById = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const item = await StockItem.findOne({ _id: req.params.id, farm }).lean();
  if (!item) throw ApiError.notFound('Stok kaydi bulunamadi');

  const movements = await StockMovement.find({ farm, item: item._id })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  return sendSuccess(res, {
    data: {
      item: present(item),
      movements: movements.map((m) => ({
        id: String(m._id),
        direction: m.direction,
        directionLabel: MOVEMENT_LABELS[m.direction],
        amount: m.amount,
        unit: m.unit,
        date: m.date,
        reason: m.reason ?? '',
        reference: m.reference ?? '',
      })),
    },
  });
});

/** POST /stock */
export const create = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const item = await StockItem.create({ ...req.body, farm });
  return sendCreated(res, { data: present(item.toObject()) });
});

/** PATCH /stock/:id */
export const update = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const payload = { ...req.body };
  delete payload.farm;

  const item = await StockItem.findOneAndUpdate(
    { _id: req.params.id, farm },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!item) throw ApiError.notFound('Stok kaydi bulunamadi');

  return sendSuccess(res, { data: present(item), message: 'Guncellendi' });
});

/** DELETE /stock/:id */
export const remove = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const item = await StockItem.findOneAndDelete({ _id: req.params.id, farm });
  if (!item) throw ApiError.notFound('Stok kaydi bulunamadi');
  await StockMovement.deleteMany({ farm, item: item._id });
  return sendSuccess(res, { message: 'Silindi' });
});

/**
 * POST /stock/:id/movements
 * Hareket kaydi ekler ve stok miktarini ATOMIK olarak gunceller.
 * Cikista negatife dusmemesi icin kosullu guncelleme kullanilir.
 */
export const addMovement = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const item = await StockItem.findOne({ _id: req.params.id, farm });
  if (!item) throw ApiError.notFound('Stok kaydi bulunamadi');

  const { direction, amount } = req.body;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const unit = req.body.unit || item.unit;

  const delta = direction === STOCK_MOVEMENT.OUT ? -amount : amount;
  const set = { updatedAt: new Date() };
  if (direction === STOCK_MOVEMENT.IN) {
    set.lastInAmount = amount;
    set.lastInAt = date;
  } else if (direction === STOCK_MOVEMENT.OUT) {
    set.lastOutAmount = amount;
    set.lastOutAt = date;
  }

  // Cikista yeterli stok yoksa guncelleme eslesmez -> hata doner.
  const query = { _id: item._id, farm };
  if (direction === STOCK_MOVEMENT.OUT) query.quantity = { $gte: amount };

  const updated = await StockItem.findOneAndUpdate(
    query,
    { $inc: { quantity: delta }, $set: set },
    { new: true }
  ).lean();
  if (!updated) throw ApiError.badRequest('Yetersiz stok: cikis miktari mevcut miktardan fazla');

  const movement = await StockMovement.create({
    farm,
    item: item._id,
    direction,
    amount,
    unit,
    date,
    reason: req.body.reason,
    reference: req.body.reference,
    recordedBy: req.auth.userId,
  });

  return sendCreated(res, {
    data: { movement, item: present(updated) },
    message: 'Stok hareketi kaydedildi',
  });
});

/** GET /stock/movements — tum hareketler (son hareketler paneli). */
export const listMovements = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm };
  if (req.query.direction) filter.direction = String(req.query.direction);
  if (req.query.days) {
    filter.date = { $gte: new Date(Date.now() - Number(req.query.days) * 86400000) };
  }

  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('item', 'name unit warehouse')
      .lean(),
    StockMovement.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map((m) => ({
      id: String(m._id),
      direction: m.direction,
      directionLabel: MOVEMENT_LABELS[m.direction],
      itemName: m.item?.name ?? '—',
      warehouse: m.item?.warehouse ?? '—',
      amount: m.amount,
      unit: m.unit || m.item?.unit || '',
      signedAmount: `${m.direction === STOCK_MOVEMENT.OUT ? '-' : '+'}${trNumber(m.amount)} ${
        m.unit || ''
      }`.trim(),
      date: m.date,
      reason: m.reason ?? '',
    })),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

/**
 * GET /stock/summary
 * Stok ekranindaki kartlar, urun dagilimi, aylik hareket trendi,
 * depo doluluklari ve kritik stok uyarilari.
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const last7 = new Date(Date.now() - 7 * 86400000);
  const year = new Date().getFullYear();

  const [items, warehouses, movementAgg, recentIn, recentOut, monthlyAgg] = await Promise.all([
    StockItem.find({ farm, isActive: true }).lean(),
    StockItem.distinct('warehouse', { farm, isActive: true }),
    // Son 7 gunun giris/cikis toplamlari.
    StockMovement.aggregate([
      { $match: { farm, date: { $gte: last7 } } },
      { $group: { _id: '$direction', total: { $sum: '$amount' } } },
    ]),
    StockMovement.countDocuments({ farm, direction: STOCK_MOVEMENT.IN, date: { $gte: last7 } }),
    StockMovement.countDocuments({ farm, direction: STOCK_MOVEMENT.OUT, date: { $gte: last7 } }),
    StockMovement.aggregate([
      { $match: { farm } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: {
            $sum: { $cond: [{ $eq: ['$direction', STOCK_MOVEMENT.OUT] }, 0, '$amount'] },
          },
          secondary: {
            $sum: { $cond: [{ $eq: ['$direction', STOCK_MOVEMENT.OUT] }, '$amount', 0] },
          },
        },
      },
    ]),
  ]);

  const presented = items.map(present);
  // Toplam stok "Ton" bazli kalemlerden hesaplanir (balya/kg karisimini bozmamak icin).
  const totalTons = items
    .filter((i) => (i.unit || '').toLocaleLowerCase('tr-TR').startsWith('ton'))
    .reduce((acc, i) => acc + Number(i.quantity || 0), 0);

  const totalIn = movementAgg.find((m) => m._id === STOCK_MOVEMENT.IN)?.total ?? 0;
  const totalOut = movementAgg.find((m) => m._id === STOCK_MOVEMENT.OUT)?.total ?? 0;
  const critical = presented.filter((i) => i.level === STOCK_LEVEL.CRITICAL);
  const medium = presented.filter((i) => i.level === STOCK_LEVEL.MEDIUM);

  return sendSuccess(res, {
    data: {
      totals: {
        totalQuantity: Math.round(totalTons * 10) / 10,
        unit: 'Ton',
        warehouses: warehouses.filter(Boolean).length,
        criticalCount: critical.length,
        lastIn: Math.round(totalIn * 10) / 10,
        lastOut: Math.round(totalOut * 10) / 10,
        inMovements: recentIn,
        outMovements: recentOut,
        // Devir hizi: donem cikisi / ortalama stok.
        turnoverRate: totalTons ? Math.round((totalOut / totalTons) * 100) / 100 : 0,
        totalValue: presented.reduce((acc, i) => acc + i.totalValue, 0),
      },
      distribution: presented
        .slice()
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6)
        .map((i) => ({ name: i.name, value: i.quantity })),
      monthlyTrend: monthlySeries(monthlyAgg, year, ['total', 'secondary']).map((p) => ({
        name: p.name,
        value: Math.round(p.total),
        secondary: Math.round(p.secondary),
      })),
      warehouseFill: presented
        .filter((i) => i.fillPercent !== null)
        .sort((a, b) => b.fillPercent - a.fillPercent)
        .map((i) => ({ name: `${i.warehouse} - ${i.name}`, value: i.fillPercent })),
      criticalItems: [...critical, ...medium].slice(0, 5),
    },
  });
});

export default {
  list,
  getById,
  create,
  update,
  remove,
  addMovement,
  listMovements,
  summary,
};
