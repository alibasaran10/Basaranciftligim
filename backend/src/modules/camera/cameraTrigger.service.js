import Camera from './camera.model.js';
import { emitToFarm } from '../../realtime/socket.js';
import { SOCKET_EVENTS } from '../../common/constants.js';
import { logger } from '../../config/logger.js';

/**
 * KAMERA TETIKLEME SERVISI.
 *
 * Olagandisi bir olay (anormal ivme, hastalik/kizginlik suphesi) tespit
 * edildiginde, hayvanin bulundugu bolgenin kamerasini bulur ve frontend'e
 * "su kamerayi ac" komutunu gercek zamanli gonderir.
 *
 * GUVENLIK: RTSP kimlik bilgileri istemciye gonderilmez. Yalnizca kamera
 * kimligi ve bolge iletilir; canli akis, sunucu tarafinda WebRTC/HLS'e
 * cevrilerek (ayri bir medya servisi) yetkili istemciye sunulur.
 */
export async function triggerCameraForZone({ farm, zoneId, animalId, reason }) {
  if (!zoneId) return null;

  const camera = await Camera.findOne({ farm, zone: zoneId, isActive: true })
    .select('_id name zone ipAddress')
    .lean();

  if (!camera) {
    logger.debug({ zone: String(zoneId) }, '[camera] bolgede aktif kamera yok');
    return null;
  }

  const payload = {
    cameraId: String(camera._id),
    cameraName: camera.name,
    zoneId: String(zoneId),
    animalId: animalId ? String(animalId) : null,
    reason,
    at: new Date().toISOString(),
  };

  emitToFarm(farm, SOCKET_EVENTS.CAMERA_OPEN, payload);
  logger.info({ camera: payload.cameraId, reason }, '[camera] kamera ac komutu gonderildi');

  return camera._id;
}

export default { triggerCameraForZone };
