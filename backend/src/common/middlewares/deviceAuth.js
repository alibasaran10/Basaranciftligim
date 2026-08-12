import { ApiError } from '../errors/ApiError.js';
import { env } from '../../config/env.js';
import { catchAsync } from '../http/catchAsync.js';
import { hashToken, safeCompare } from '../security/tokens.js';
import Device from '../../modules/device/device.model.js';
import { normalizeMac } from '../utils/mac.js';

/**
 * ESP32 cihazlari icin kimlik dogrulama.
 * Cihaz "x-device-key: <apiKey>" basligi gonderir.
 *
 * Dogrulama sirasi:
 *  1) Istekteki MAC adresine ait cihaz bulunur.
 *  2) Cihaza ozel apiKeyHash varsa onunla dogrulanir (ONERILEN).
 *  3) Cihaza ozel anahtar yoksa global DEVICE_INGEST_API_KEY fallback kullanilir.
 *
 * Boylece bir cihazin anahtari sizarsa yalnizca o cihaz iptal edilir.
 */
export const deviceAuth = catchAsync(async (req, _res, next) => {
  const providedKey = req.headers['x-device-key'];
  if (!providedKey || typeof providedKey !== 'string') {
    throw ApiError.unauthorized('Cihaz API anahtari eksik (x-device-key)');
  }

  const mac = normalizeMac(req.body?.mac || req.body?.macAddress);
  if (!mac) {
    throw ApiError.badRequest('Cihaz MAC adresi zorunludur');
  }

  // apiKeyHash model'de select:false; kimlik dogrulama icin acikca istiyoruz.
  const device = await Device.findOne({ macAddress: mac }).select('+apiKeyHash');
  if (!device) {
    throw ApiError.unauthorized('Kayitli olmayan cihaz');
  }

  let authorized = false;
  if (device.apiKeyHash) {
    // Cihaza ozel anahtar (sabit sureli karsilastirma icin hash uzerinden).
    authorized = safeCompare(hashToken(providedKey), device.apiKeyHash);
  } else {
    // Global fallback anahtari.
    authorized = safeCompare(providedKey, env.DEVICE_INGEST_API_KEY);
  }

  if (!authorized) {
    throw ApiError.unauthorized('Cihaz kimlik dogrulamasi basarisiz');
  }

  req.device = device;
  next();
});

export default deviceAuth;
