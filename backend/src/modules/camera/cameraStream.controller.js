import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { logger } from '../../config/logger.js';
import {
  generateApiKey,
  hashToken,
  signStreamToken,
  verifyStreamToken,
  STREAM_TOKEN_TTL_SECONDS,
} from '../../common/security/tokens.js';
import Camera from './camera.model.js';
import { getLatestFrame, subscribe, isOnline, viewerCount } from './frameStore.js';

/**
 * Canli goruntu uclari.
 *
 * Kareler bellekten servis edilir (bkz. frameStore.js); bu uclar veritabanina
 * hic dokunmaz --- kamera basina saniyede 10-15 istek geldigi icin her
 * karede sorgu atmak sunucuyu bogardi. Yalnizca yetki dogrulamasi ve
 * kamera-ciftlik eslesmesi icin tek bir hafif sorgu yapilir.
 */

/** MJPEG akisinda kareleri ayiran sinir dizgisi. */
const BOUNDARY = 'surumframe';

/**
 * Kamera kullanicinin ciftligine mi ait?
 * Baska bir ciftligin kamerasini izlemeyi engeller (yatay yetki asimi).
 */
async function findOwnedCamera(cameraId, farmId) {
  if (!mongoose.isValidObjectId(cameraId)) {
    throw ApiError.badRequest('Gecersiz kamera kimligi');
  }
  const camera = await Camera.findOne({ _id: cameraId, farm: farmId }).select('name farm').lean();
  if (!camera) throw ApiError.notFound('Kamera bulunamadi');
  return camera;
}

/**
 * POST /cameras/:id/stream-token
 * Canli goruntuyu acmadan once alinan kisa omurlu jeton.
 * Panel bu jetonu <img src> URL'sine koyar.
 */
export const createStreamToken = catchAsync(async (req, res) => {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');

  const camera = await findOwnedCamera(req.params.id, farmId);

  const token = signStreamToken({
    userId: req.auth.userId,
    farmId,
    cameraId: camera._id,
  });

  return sendSuccess(res, {
    data: {
      token,
      expiresInSeconds: STREAM_TOKEN_TTL_SECONDS,
      streamUrl: `/cameras/${camera._id}/stream.mjpeg?token=${token}`,
      snapshotUrl: `/cameras/${camera._id}/snapshot.jpg?token=${token}`,
      online: isOnline(camera._id),
    },
  });
});

/**
 * Akis jetonunu dogrular. Bu uclar `authenticate` middleware'inden ONCE
 * tanimlandigi icin yetki kontrolu burada elle yapilir.
 */
function requireStreamToken(req) {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    throw ApiError.unauthorized('Canli goruntu jetonu eksik');
  }
  try {
    return verifyStreamToken(token, req.params.id);
  } catch {
    throw ApiError.unauthorized('Canli goruntu jetonu gecersiz veya suresi dolmus');
  }
}

/**
 * GET /cameras/:id/snapshot.jpg?token=...
 * Kameranin en son karesi. Poster/onizleme icin kullanilir.
 */
export const snapshot = catchAsync(async (req, res) => {
  requireStreamToken(req);

  const frame = getLatestFrame(req.params.id);
  if (!frame) {
    throw ApiError.notFound('Bu kameradan henuz goruntu alinmadi');
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Length', frame.bytes);
  // Onizleme her zaman taze olmali; ara katmanlar onbelleklememeli.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  return res.end(frame.jpeg);
});

/**
 * GET /cameras/:id/stream.mjpeg?token=...
 *
 * Cok parcali (multipart/x-mixed-replace) MJPEG akisi. Tarayici bunu
 * dogrudan <img> icinde oynatir --- ne WebRTC signaling'i ne de ek bir
 * istemci kutuphanesi gerekir. Mobilde de ayni uc, parcalari elle
 * ayristiran kucuk bir widget ile kullanilir.
 */
export const streamMjpeg = catchAsync(async (req, res) => {
  requireStreamToken(req);
  const cameraId = req.params.id;

  res.writeHead(200, {
    'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Connection: 'close',
    // Ters proxy (nginx) arkasinda tamponlama akisi kilitler.
    'X-Accel-Buffering': 'no',
  });

  let closed = false;

  const writeFrame = (frame) => {
    if (closed) return;
    // Yavas istemci (zayif mobil hat) birikmesin: tampon dolmussa bu
    // kareyi atla. Canli goruntude gecikmis kare gostermektense
    // kare dusurmek dogru davranistir.
    if (res.writableLength > 0) return;

    res.write(
      `--${BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.bytes}\r\n\r\n`
    );
    res.write(frame.jpeg);
    res.write('\r\n');
  };

  // Ilk kareyi hemen gonder ki panel bos kalmasin.
  const initial = getLatestFrame(cameraId);
  if (initial) writeFrame(initial);

  const unsubscribe = subscribe(cameraId, writeFrame);

  logger.debug({ cameraId, viewers: viewerCount(cameraId) }, '[stream] izleyici baglandi');

  const cleanup = () => {
    if (closed) return;
    closed = true;
    unsubscribe();
    logger.debug({ cameraId, viewers: viewerCount(cameraId) }, '[stream] izleyici ayrildi');
  };

  // Istemci sekmeyi kapattiginda aboneligi mutlaka birak (bellek sizintisi).
  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('error', cleanup);
});

/**
 * POST /cameras/:id/stream-key
 * Kamera icin yeni saha ajani anahtari uretir.
 *
 * Anahtarin duz hali YALNIZCA bu yanitta bir kez gorunur; veritabaninda
 * SHA-256 ozeti saklanir. Yeniden uretmek eski anahtari gecersiz kilar.
 */
export const rotateStreamKey = catchAsync(async (req, res) => {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');

  const camera = await Camera.findOne({ _id: req.params.id, farm: farmId });
  if (!camera) throw ApiError.notFound('Kamera bulunamadi');

  const apiKey = generateApiKey();
  camera.streamKeyHash = hashToken(apiKey);
  await camera.save();

  logger.info({ cameraId: String(camera._id) }, '[stream] ajan anahtari yenilendi');

  return sendSuccess(res, {
    message: 'Ajan anahtari olusturuldu. Bu anahtar bir daha gosterilmeyecek.',
    data: {
      cameraId: String(camera._id),
      cameraName: camera.name,
      apiKey,
      source: camera.source,
      capture: {
        width: camera.captureWidth,
        height: camera.captureHeight,
        fps: camera.captureFps,
        jpegQuality: camera.jpegQuality,
      },
    },
  });
});

export default { createStreamToken, snapshot, streamMjpeg, rotateStreamKey };
