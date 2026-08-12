import mongoose from 'mongoose';

/**
 * Iki sayfalandirma stratejisi:
 *
 * 1) parseOffsetPagination -> klasik page/limit (yonetim ekranlari icin).
 *    Kucuk/orta veri kumelerinde ve "toplam sayfa" gerektiginde kullanilir.
 *    Cok buyuk offset degerlerinde MongoDB'de yavaslar (skip maliyeti).
 *
 * 2) parseCursorPagination -> keyset (cursor) sayfalandirma.
 *    Milyarlarca satirlik telemetri/log verisinde ONERILEN yontem.
 *    "skip" kullanmaz; _id (veya ts) uzerinden indeks ile sabit hizda ilerler.
 */

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 20;

export function parseOffsetPagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

export function buildOffsetMeta({ page, limit, total }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    pagination: {
      strategy: 'offset',
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Cursor tabanli sayfalandirma parametrelerini cozer.
 * cursor: bir onceki sayfanin son dokumaninin _id degeri (base64 degil, ham ObjectId string).
 * sort: 'desc' (yeniden eskiye, varsayilan) | 'asc'
 */
export function parseCursorPagination(query = {}) {
  let limit = parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const direction = query.sort === 'asc' ? 1 : -1;

  let cursorFilter = {};
  if (query.cursor && mongoose.Types.ObjectId.isValid(query.cursor)) {
    const id = new mongoose.Types.ObjectId(query.cursor);
    // desc: _id < cursor  |  asc: _id > cursor
    cursorFilter = { _id: direction === -1 ? { $lt: id } : { $gt: id } };
  }

  return { limit, direction, cursorFilter, sort: { _id: direction } };
}

/**
 * Keyset sorgusunda "limit + 1" cekilir; fazladan gelen kayit varsa
 * sonraki sayfa oldugu anlasilir ve nextCursor uretilir.
 */
export function buildCursorResult(docs, limit) {
  const hasNextPage = docs.length > limit;
  const items = hasNextPage ? docs.slice(0, limit) : docs;
  const nextCursor = hasNextPage ? String(items[items.length - 1]._id) : null;
  return {
    items,
    meta: {
      pagination: {
        strategy: 'cursor',
        limit,
        count: items.length,
        hasNextPage,
        nextCursor,
      },
    },
  };
}

export default {
  parseOffsetPagination,
  buildOffsetMeta,
  parseCursorPagination,
  buildCursorResult,
};
