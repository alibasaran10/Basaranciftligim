import { EventEmitter } from 'node:events';
import { logger } from '../../config/logger.js';

/**
 * Canli kamera karelerinin bellek ici deposu.
 *
 * Kareler DISKE VE VERITABANINA YAZILMAZ; yalnizca "en son kare" tutulur ve
 * izleyen istemcilere aninda dagitilir. Boyle olmasinin sebebi: saniyede
 * 10-15 kare * kamera basina, kalici yazma ile hem diski hem Mongo'yu
 * gereksiz yere doldururdu. Kalici olmasi gereken sey kare degil, OLAY'dir
 * (hareket algilandi vb.) --- o da CameraEvent olarak ayrica yazilir.
 *
 * Bir kamera icin izleyici yoksa kare yine de saklanir (son kare/snapshot
 * icin gerekli) ama kimseye dagitilmaz.
 */

/** Kamera bu sure boyunca kare gondermezse "cevrimdisi" sayilir. */
export const STALE_AFTER_MS = 15_000;

/** Bir kareye izin verilen en buyuk boyut (kotu/ele gecirilmis ajana karsi). */
export const MAX_FRAME_BYTES = 2 * 1024 * 1024;

/** cameraId -> { jpeg, receivedAt, sequence, width, height, bytes } */
const frames = new Map();

/** cameraId -> Set<callback> (MJPEG akislari ve olay dinleyicileri) */
const subscribers = new Map();

/** Kamera cevrimici/cevrimdisi gecislerini duyurur. */
export const frameEvents = new EventEmitter();

/**
 * JPEG imzasi dogrulamasi. Ajanin gonderdigi verinin gercekten JPEG
 * oldugunu teyit eder; keyfi ikili veriyi istemciye "resim" diye
 * servis etmemizi engeller.
 */
function isJpeg(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[buffer.length - 2] === 0xff &&
    buffer[buffer.length - 1] === 0xd9
  );
}

/**
 * Ajandan gelen yeni kareyi kaydeder ve izleyicilere dagitir.
 * Gecersiz kare sessizce yutulmaz; cagiran taraf bilgilendirilir.
 *
 * @returns {{ ok: true, sequence: number } | { ok: false, reason: string }}
 */
export function pushFrame(cameraId, jpeg, meta = {}) {
  const id = String(cameraId);

  if (!Buffer.isBuffer(jpeg) || jpeg.length === 0) {
    return { ok: false, reason: 'Bos kare' };
  }
  if (jpeg.length > MAX_FRAME_BYTES) {
    return { ok: false, reason: `Kare cok buyuk (${jpeg.length} bayt)` };
  }
  if (!isJpeg(jpeg)) {
    return { ok: false, reason: 'Kare gecerli bir JPEG degil' };
  }

  const previous = frames.get(id);
  const wasOnline = isOnline(id);

  const entry = {
    jpeg,
    receivedAt: Date.now(),
    sequence: (previous?.sequence ?? 0) + 1,
    width: meta.width ?? previous?.width ?? null,
    height: meta.height ?? previous?.height ?? null,
    bytes: jpeg.length,
  };
  frames.set(id, entry);

  if (!wasOnline) {
    frameEvents.emit('online', { cameraId: id });
  }

  const listeners = subscribers.get(id);
  if (listeners) {
    for (const send of listeners) {
      try {
        send(entry);
      } catch (err) {
        // Tek bir bozuk izleyici digerlerinin akisini kesmemeli.
        logger.warn({ err, cameraId: id }, '[frame] izleyiciye gonderilemedi');
      }
    }
  }

  return { ok: true, sequence: entry.sequence };
}

/** Kameranin en son karesi (yoksa null). */
export function getLatestFrame(cameraId) {
  return frames.get(String(cameraId)) ?? null;
}

/** Kamera su an canli kare gonderiyor mu? */
export function isOnline(cameraId) {
  const entry = frames.get(String(cameraId));
  if (!entry) return false;
  return Date.now() - entry.receivedAt < STALE_AFTER_MS;
}

/** Canli yayin yapan tum kamera kimlikleri. */
export function onlineCameraIds() {
  const ids = [];
  for (const id of frames.keys()) {
    if (isOnline(id)) ids.push(id);
  }
  return ids;
}

/**
 * Bir kameranin karelerine abone olur.
 * Donen fonksiyon cagrildiginda abonelik biter (MJPEG istemcisi
 * baglantiyi kapattiginda mutlaka cagrilmali, yoksa bellek sizar).
 */
export function subscribe(cameraId, onFrame) {
  const id = String(cameraId);
  if (!subscribers.has(id)) subscribers.set(id, new Set());
  const set = subscribers.get(id);
  set.add(onFrame);

  return function unsubscribe() {
    const current = subscribers.get(id);
    if (!current) return;
    current.delete(onFrame);
    if (current.size === 0) subscribers.delete(id);
  };
}

/** Bir kamerayi izleyen istemci sayisi (tanilama/loglama icin). */
export function viewerCount(cameraId) {
  return subscribers.get(String(cameraId))?.size ?? 0;
}

/** Ajan baglantiyi kapattiginda kareyi dusur. */
export function clearCamera(cameraId) {
  const id = String(cameraId);
  const existed = frames.delete(id);
  if (existed) frameEvents.emit('offline', { cameraId: id });
}

/**
 * Kare gondermeyi birakmis kameralari periyodik olarak temizler ve
 * "cevrimdisi" olayini tetikler. Aksi halde ajan ansizin olduginde
 * (guc kesintisi) kamera sonsuza dek "cevrimici" gorunurdu.
 */
let sweeper = null;

export function startFrameSweeper(intervalMs = 5_000) {
  if (sweeper) return sweeper;
  sweeper = setInterval(() => {
    for (const [id, entry] of frames) {
      if (Date.now() - entry.receivedAt >= STALE_AFTER_MS) {
        frames.delete(id);
        frameEvents.emit('offline', { cameraId: id });
        logger.debug({ cameraId: id }, '[frame] kamera zaman asimi, cevrimdisi');
      }
    }
  }, intervalMs);
  sweeper.unref();
  return sweeper;
}

export function stopFrameSweeper() {
  if (!sweeper) return;
  clearInterval(sweeper);
  sweeper = null;
}

export default {
  pushFrame,
  getLatestFrame,
  isOnline,
  onlineCameraIds,
  subscribe,
  viewerCount,
  clearCamera,
  frameEvents,
  startFrameSweeper,
  stopFrameSweeper,
  STALE_AFTER_MS,
  MAX_FRAME_BYTES,
};
