import { catchAsync } from '../http/catchAsync.js';
import { sendSuccess, sendCreated } from '../http/response.js';
import { ApiError } from '../errors/ApiError.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../http/pagination.js';

/**
 * Farm-scope'lu (cok-kiracili) generic CRUD controller uretici.
 *
 * Guvenlik ilkeleri:
 *  - TUM sorgular istegin ciftligiyle (req.auth.farmId) filtrelenir. Kullanici
 *    baska ciftligin kaydina ID bilse bile erisemez (IDOR/BOLA korumasi).
 *  - Yazma alanlari zaten validate middleware'inde whitelist edilir; burada
 *    ayrica "farm" gibi alanlarin istemciden gelmesi engellenir.
 *
 * @param {import('mongoose').Model} Model
 * @param {object} opts
 * @param {string[]} [opts.searchFields]  - metin aramasi yapilacak alanlar
 * @param {string[]} [opts.filterFields] - query string'ten birebir eslesme ile
 *   filtrelenebilecek alanlar (whitelist; keyfi alan filtrelenemez)
 * @param {string[]} [opts.populate]      - list/get'te doldurulacak referanslar
 * @param {object} [opts.sort]            - varsayilan siralama
 * @param {(req)=>object} [opts.baseFilter] - ek sabit filtre
 * @param {string} [opts.notFoundMessage]
 */
export function createCrudController(Model, opts = {}) {
  const {
    searchFields = [],
    filterFields = [],
    populate = [],
    sort = { createdAt: -1 },
    baseFilter = () => ({}),
    notFoundMessage = 'Kayit bulunamadi',
  } = opts;

  const scoped = (req, extra = {}) => {
    const farmId = req.auth?.farmId;
    if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
    return { farm: farmId, ...baseFilter(req), ...extra };
  };

  const create = catchAsync(async (req, res) => {
    // farm ASLA istemciden alinmaz; oturumdan gelir.
    const payload = { ...req.body, farm: req.auth.farmId };
    const doc = await Model.create(payload);
    return sendCreated(res, { data: doc });
  });

  const list = catchAsync(async (req, res) => {
    const { page, limit, skip } = parseOffsetPagination(req.query);
    const filter = scoped(req);

    // Guvenli metin aramasi: kullanici girdisi regex ozel karakterlerinden
    // arindirilarak kullanilir (ReDoS/enjeksiyon onlemi).
    if (req.query.q && searchFields.length) {
      const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
      filter.$or = searchFields.map((f) => ({ [f]: { $regex: safe, $options: 'i' } }));
    }

    // Beyaz listedeki alanlar icin birebir eslesme filtresi. Deger daima
    // string'e cevrilir; boylece query'den nesne/dizi gelip operator
    // enjeksiyonuna donusemez.
    for (const field of filterFields) {
      const value = req.query[field];
      if (value === undefined || value === '') continue;
      filter[field] = String(value).slice(0, 120);
    }

    let query = Model.find(filter).sort(sort).skip(skip).limit(limit);
    for (const p of populate) query = query.populate(p);

    const [items, total] = await Promise.all([
      query.lean(),
      Model.countDocuments(filter),
    ]);

    return sendSuccess(res, { data: items, meta: buildOffsetMeta({ page, limit, total }) });
  });

  const getById = catchAsync(async (req, res) => {
    let query = Model.findOne(scoped(req, { _id: req.params.id }));
    for (const p of populate) query = query.populate(p);
    const doc = await query;
    if (!doc) throw ApiError.notFound(notFoundMessage);
    return sendSuccess(res, { data: doc });
  });

  const update = catchAsync(async (req, res) => {
    // farm degistirilemez; guncelleme yalnizca kendi ciftliginde.
    const payload = { ...req.body };
    delete payload.farm;

    const doc = await Model.findOneAndUpdate(
      scoped(req, { _id: req.params.id }),
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!doc) throw ApiError.notFound(notFoundMessage);
    return sendSuccess(res, { data: doc, message: 'Guncellendi' });
  });

  const remove = catchAsync(async (req, res) => {
    const doc = await Model.findOneAndDelete(scoped(req, { _id: req.params.id }));
    if (!doc) throw ApiError.notFound(notFoundMessage);
    return sendSuccess(res, { message: 'Silindi' });
  });

  return { create, list, getById, update, remove, scoped };
}

export default createCrudController;
