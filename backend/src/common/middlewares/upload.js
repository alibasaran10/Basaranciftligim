import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../errors/ApiError.js';

/**
 * Guvenli dosya yukleme (file-upload injection'a karsi).
 * Alinan onlemler:
 *  - Beyaz liste: yalnizca izin verilen MIME + uzanti (cift kontrol).
 *  - Rastgele dosya adi: kullanicidan gelen ad KULLANILMAZ (path traversal,
 *    ".." ve "/" enjeksiyonu ile klasor disina yazma engellenir).
 *  - Boyut siniri.
 *  - Tek dosya / alan sinirlari.
 *
 * NOT: Uretimde ek olarak dosya icerigi (magic bytes) taramasi ve
 * antivirus (clamav) onerilir; ayrica yuklenen dizin statik olarak
 * SUNULUYORSA uzantiya gore Content-Type/`X-Content-Type-Options: nosniff`
 * zorunludur (bkz. app.js).
 */
const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);

// Dizin yoksa olustur.
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype];
    if (!ext) return cb(ApiError.badRequest('Desteklenmeyen dosya turu'));
    // Kullanici adini asla kullanma; kriptografik rastgele ad uret.
    const name = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = Object.values(ALLOWED);
  // Hem MIME hem uzanti beyaz listede olmali.
  if (!ALLOWED[file.mimetype] || !allowedExt.includes(ext)) {
    return cb(ApiError.badRequest('Yalnizca JPG, PNG, WEBP gorseller yuklenebilir'));
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxUploadBytes,
    files: 1,
    fields: 20,
  },
});

// Multer hatalarini ApiError'a cevir.
export function handleUploadErrors(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`Dosya boyutu ${env.MAX_UPLOAD_SIZE_MB}MB sinirini asiyor`));
    }
    return next(ApiError.badRequest(`Yukleme hatasi: ${err.message}`));
  }
  next(err);
}

export { UPLOAD_ROOT };
export default uploadImage;
