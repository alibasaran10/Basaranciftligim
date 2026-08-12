import { Router } from 'express';
import * as controller from './telemetry.controller.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate } from '../../common/middlewares/auth.js';
import { deviceAuth } from '../../common/middlewares/deviceAuth.js';
import { ingestLimiter } from '../../common/middlewares/rateLimiters.js';
import { ingestSchema, listTelemetryQuerySchema } from './telemetry.validation.js';

const router = Router();

/**
 * Cihaz veri kabul ucu.
 * Sira: rate limit -> body dogrulama -> cihaz kimligi -> isle.
 * (Once validate, cunku deviceAuth body.mac'e bakiyor; ikisi de body'yi okur.)
 */
router.post(
  '/ingest',
  ingestLimiter,
  validate({ body: ingestSchema }),
  deviceAuth,
  controller.ingest
);

// Senkronizasyon durumu (mobil "Veri Senkronizasyonu" ekrani).
router.get('/sync-status', authenticate, controller.syncStatus);

// Kullanicilar icin telemetri gecmisi (cursor sayfalandirma).
router.get(
  '/',
  authenticate,
  validate({ query: listTelemetryQuerySchema }),
  controller.list
);

export default router;
