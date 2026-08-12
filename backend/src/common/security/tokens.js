import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

/**
 * JWT uretimi/dogrulamasi. Access token kisa omurlu (API erisimi),
 * refresh token uzun omurlu (yeni access token almak icin).
 * Iki farkli secret kullanilir; boylece bir tur token digerinin
 * yerine gecemez.
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    algorithm: 'HS256',
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
}

/**
 * Canli goruntu icin kisa omurlu jeton.
 *
 * NEDEN AYRI BIR JETON: Tarayicidaki <img src="..."> ve mobildeki goruntu
 * yukleyicisi Authorization basligi gonderemez, jeton URL'ye girmek
 * zorundadir. URL'ler sunucu loglarina ve tarayici gecmisine dusebildigi
 * icin buraya asla access token konmaz. Bunun yerine yalnizca TEK BIR
 * kameraya kapsamli, 2 dakika omurlu ve baska hicbir uctan kabul edilmeyen
 * bu jeton kullanilir.
 */
const STREAM_TOKEN_PURPOSE = 'camera-stream';
export const STREAM_TOKEN_TTL_SECONDS = 120;

export function signStreamToken({ userId, farmId, cameraId }) {
  return jwt.sign(
    { sub: String(userId), farm: String(farmId), cam: String(cameraId), pur: STREAM_TOKEN_PURPOSE },
    env.JWT_ACCESS_SECRET,
    { expiresIn: STREAM_TOKEN_TTL_SECONDS, algorithm: 'HS256' }
  );
}

/**
 * Akis jetonunu dogrular ve istenen kameraya ait oldugunu teyit eder.
 * Gecerli bir access token bu uctan kabul EDILMEZ (pur alani tutmaz);
 * boylece sizan bir akis URL'si genel API erisimine donusemez.
 */
export function verifyStreamToken(token, cameraId) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
  if (payload.pur !== STREAM_TOKEN_PURPOSE) {
    throw new Error('Jeton canli goruntu icin verilmemis');
  }
  if (String(payload.cam) !== String(cameraId)) {
    throw new Error('Jeton bu kamera icin gecerli degil');
  }
  return payload;
}

/**
 * Cihaz API anahtari / refresh token gibi degerleri veritabaninda
 * duz metin yerine SHA-256 ozet olarak saklamak icin.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Zamanlama saldirilarina karsi sabit sureli karsilastirma.
 * API anahtari dogrulamasinda kullanilir.
 */
export function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signStreamToken,
  verifyStreamToken,
  hashToken,
  safeCompare,
  generateApiKey,
  STREAM_TOKEN_TTL_SECONDS,
};
