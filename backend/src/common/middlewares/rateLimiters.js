import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';

/**
 * Rate limit'ler kaba-kuvvet (brute force) ve DoS'a karsi ilk savunma hattidir.
 * Uretimde birden fazla instance calisiyorsa ortak bir store (Redis) onerilir;
 * bellekte tutulan sayaclar instance basina ayridir.
 */
const jsonHandler = (_req, res) =>
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Cok fazla istek. Lutfen sonra tekrar deneyin.' },
  });

// Genel API limiti.
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

// Giris/kayit gibi hassas uclar icin siki limit (kaba-kuvvete karsi).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // basarili girisleri sayma
  handler: jsonHandler,
});

// Cihaz veri kabul ucu icin daha yuksek limit (cok sayida cihaz).
export const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.INGEST_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // Cihaz basina limitle (IP yerine MAC/anahtar bazli daha adil).
  keyGenerator: (req) => req.headers['x-device-key'] || req.ip,
  handler: jsonHandler,
});

export default { globalLimiter, authLimiter, ingestLimiter };
