import mongoose from 'mongoose';
import { ApiError } from '../errors/ApiError.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

/**
 * Merkezi hata yakalayici. Tum hatalar tek tip JSON ile doner ve
 * production'da ic detaylar (stack, sorgu, vs.) SIZDIRILMAZ.
 *
 * Mongoose'a ozel hatalar okunabilir mesajlara cevrilir.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // --- Mongoose: gecersiz ObjectId / cast hatasi ---
  if (error instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Gecersiz ${error.path}: ${error.value}`);
  }

  // --- Mongoose: sema dogrulama hatasi ---
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('Dogrulama hatasi', details);
  }

  // --- MongoDB: benzersizlik (unique) ihlali ---
  if (error?.code === 11000) {
    const fields = Object.keys(error.keyValue || {}).join(', ');
    error = ApiError.conflict(`Bu deger zaten kayitli: ${fields}`, error.keyValue);
  }

  // --- JSON parse hatasi (kotu istek govdesi) ---
  if (error?.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Gecersiz JSON govdesi');
  }

  // --- Bilinmeyen hatalar -> 500, detay gizli ---
  if (!(error instanceof ApiError)) {
    logger.error({ err, path: req.originalUrl, method: req.method }, 'Beklenmeyen hata');
    error = ApiError.internal();
  } else if (!error.isOperational) {
    logger.error({ err, path: req.originalUrl }, 'Operasyonel olmayan hata');
  } else {
    logger.warn({ code: error.code, path: req.originalUrl }, error.message);
  }

  const body = {
    success: false,
    error: {
      code: error.code || 'ERROR',
      message: error.message,
    },
  };
  if (error.details) body.error.details = error.details;
  // Stack yalnizca development'ta.
  if (env.isDev && err.stack) body.error.stack = err.stack;

  res.status(error.statusCode || 500).json(body);
};

export default errorHandler;
