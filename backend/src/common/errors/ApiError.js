/**
 * Uygulama genelinde tutarli, operasyonel (beklenen) hatalar icin sinif.
 * "isOperational" true ise bu bilincli firlatilmis bir hatadir; global hata
 * yakalayici bunu istemciye guvenle gosterir. Aksi hallerde 500 doner ve
 * detay sizdirilmaz.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code = undefined, details = undefined, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Gecersiz istek', details) {
    return new ApiError(400, msg, { code: 'BAD_REQUEST', details });
  }

  static unauthorized(msg = 'Kimlik dogrulama gerekli') {
    return new ApiError(401, msg, { code: 'UNAUTHORIZED' });
  }

  static forbidden(msg = 'Bu islem icin yetkiniz yok') {
    return new ApiError(403, msg, { code: 'FORBIDDEN' });
  }

  static notFound(msg = 'Kayit bulunamadi') {
    return new ApiError(404, msg, { code: 'NOT_FOUND' });
  }

  static conflict(msg = 'Cakisma: kayit zaten mevcut', details) {
    return new ApiError(409, msg, { code: 'CONFLICT', details });
  }

  static tooMany(msg = 'Cok fazla istek') {
    return new ApiError(429, msg, { code: 'RATE_LIMITED' });
  }

  static internal(msg = 'Sunucu hatasi') {
    return new ApiError(500, msg, { code: 'INTERNAL', isOperational: false });
  }
}

export default ApiError;
