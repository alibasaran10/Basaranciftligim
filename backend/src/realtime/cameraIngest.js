import { WebSocketServer } from 'ws';
import { logger } from '../config/logger.js';
import { hashToken } from '../common/security/tokens.js';
import { CAMERA_EVENT_TYPE, SOCKET_EVENTS } from '../common/constants.js';
import Camera from '../modules/camera/camera.model.js';
import CameraEvent from '../modules/camera/cameraEvent.model.js';
import {
  pushFrame,
  clearCamera,
  frameEvents,
  startFrameSweeper,
  stopFrameSweeper,
  MAX_FRAME_BYTES,
} from '../modules/camera/frameStore.js';
import { emitToFarm } from './socket.js';

/**
 * Saha ajani (Raspberry Pi) icin goruntu kabul kanali.
 *
 * NEDEN WEBSOCKET VE NEDEN ICERIDEN DISARI:
 * Pi sahada, ev/tarla routerinin arkasindadir; genelde CGNAT altindadir ve
 * disaridan erisilemez. Bu yuzden BAGLANTIYI PI BASLATIR. Pi'nin internete
 * cikabilmesi yeterli olur --- port yonlendirme, sabit IP veya VPN gerekmez.
 * Kamera boylece konum farketmeksizin calisir.
 *
 * PROTOKOL:
 *   1. Pi baglanir:  ws://<host>/ingest/camera
 *      Baslik:       x-camera-key: <ajan anahtari>
 *   2. Pi ilk mesaj olarak JSON "hello" gonderir (model, surum, cozunurluk).
 *   3. Sunucu JSON "ready" ile yakalama ayarlarini bildirir (fps, boyut...).
 *      Ayarlari panelden degistirince Pi'yi yeniden baslatmak gerekmez.
 *   4. Pi bundan sonra IKILI JPEG kareler gonderir.
 *
 * Kimlik dogrulama anahtarin SHA-256 ozetiyle yapilir; duz anahtar DB'de
 * hicbir zaman tutulmaz (bkz. camera.model.js streamKeyHash).
 */

export const INGEST_PATH = '/ingest/camera';

/** Ajan bu sure boyunca hicbir sey gondermezse baglanti dusurulur. */
const HEARTBEAT_MS = 30_000;

/**
 * lastFrameAt her karede yazilsa saniyede onlarca gereksiz Mongo yazmasi
 * olurdu. Kamera "cevrimici mi" sorusu zaten bellekteki frameStore'dan
 * yanitlanir; DB'deki alan yalnizca sunucu yeniden baslatildiginda anlamli
 * oldugu icin seyrek yazmak yeterli.
 */
const LAST_FRAME_WRITE_INTERVAL_MS = 15_000;

let wss = null;

/**
 * Ajan anahtarindan kamerayi bulur.
 * Ozet uzerinden dogrudan esleme yapildigi icin zamanlama saldirisi
 * yuzeyi yoktur (arama girdisi zaten tek yonlu ozet).
 */
async function authenticateAgent(providedKey) {
  if (!providedKey || typeof providedKey !== 'string' || providedKey.length < 16) {
    return null;
  }
  return Camera.findOne({ streamKeyHash: hashToken(providedKey), isActive: true })
    .select('+streamKeyHash')
    .populate('zone', 'name');
}

/** Ajana gonderilecek yakalama ayarlari. */
function captureConfig(camera) {
  return {
    type: 'ready',
    cameraId: String(camera._id),
    cameraName: camera.name,
    source: camera.source,
    sourceIndex: camera.sourceIndex,
    width: camera.captureWidth,
    height: camera.captureHeight,
    fps: camera.captureFps,
    jpegQuality: camera.jpegQuality,
    rtspPath: camera.source === 'rtsp' ? camera.rtspPath || null : null,
  };
}

/**
 * Kamera cevrimici/cevrimdisi olunca hem olay kaydi yazar hem de
 * panellere anlik bildirim gonderir.
 */
function wireStatusEvents() {
  frameEvents.on('offline', async ({ cameraId }) => {
    try {
      const camera = await Camera.findById(cameraId).select('farm name');
      if (!camera) return;
      emitToFarm(camera.farm, SOCKET_EVENTS.CAMERA_STATUS, {
        cameraId: String(cameraId),
        online: false,
      });
      await CameraEvent.create({
        farm: camera.farm,
        camera: camera._id,
        type: CAMERA_EVENT_TYPE.OFFLINE,
        occurredAt: new Date(),
        notes: 'Ajan kare gondermeyi birakti',
      });
    } catch (err) {
      logger.warn({ err, cameraId }, '[ingest] cevrimdisi olayi yazilamadi');
    }
  });

  frameEvents.on('online', async ({ cameraId }) => {
    try {
      const camera = await Camera.findById(cameraId).select('farm');
      if (!camera) return;
      emitToFarm(camera.farm, SOCKET_EVENTS.CAMERA_STATUS, {
        cameraId: String(cameraId),
        online: true,
      });
    } catch (err) {
      logger.warn({ err, cameraId }, '[ingest] cevrimici bildirimi gonderilemedi');
    }
  });
}

/**
 * Ingest sunucusunu kurar. Socket.IO ile ayni HTTP sunucusunu paylasir;
 * ayrisma "upgrade" olayinda yol (path) bakilarak yapilir.
 */
export function initCameraIngest(httpServer) {
  wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_FRAME_BYTES,
    // Kareler zaten JPEG (sikistirilmis); tekrar sikistirmak sadece
    // CPU yakar, kazanc getirmez.
    perMessageDeflate: false,
  });

  httpServer.on('upgrade', (request, socket, head) => {
    let pathname;
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      return; // Bozuk URL: Socket.IO'nun kendi isleyicisine birak.
    }
    if (pathname !== INGEST_PATH) return; // Socket.IO yolu; bize ait degil.

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', async (ws, request) => {
    // Kimlik dogrulamasi ve ilk kurulum "await" gerektirir; bu sure icinde
    // ajanin gonderdigi mesajlar dinleyici HENUZ KAYITLI OLMADIGI icin
    // kaybolurdu (ws mesajlari tamponlamaz). Bu yuzden soket bastan
    // duraklatilir, kurulum bitince devam ettirilir --- ajanin "hello"
    // mesaji ve ilk kareler boylece kaybolmaz.
    ws.pause();

    const key = request.headers['x-camera-key'];
    const camera = await authenticateAgent(key);

    if (!camera) {
      logger.warn(
        { ip: request.socket.remoteAddress },
        '[ingest] gecersiz ajan anahtari, baglanti reddedildi'
      );
      // Kapanis el sikismasinin tamamlanabilmesi icin soket devam etmeli.
      ws.resume();
      ws.close(4401, 'Gecersiz kamera anahtari');
      return;
    }

    const cameraId = String(camera._id);
    const farmId = String(camera.farm);
    let alive = true;
    let lastFrameWriteAt = 0;
    let frameCount = 0;

    logger.info({ cameraId, name: camera.name }, '[ingest] ajan baglandi');

    await Camera.updateOne(
      { _id: camera._id },
      { $set: { agentConnectedAt: new Date() } }
    );

    ws.send(JSON.stringify(captureConfig(camera)));

    ws.on('message', async (data, isBinary) => {
      alive = true;

      // --- Ikili mesaj: JPEG kare ---
      if (isBinary) {
        const result = pushFrame(cameraId, data);
        if (!result.ok) {
          logger.warn({ cameraId, reason: result.reason }, '[ingest] kare reddedildi');
          return;
        }

        frameCount += 1;
        const now = Date.now();
        if (now - lastFrameWriteAt >= LAST_FRAME_WRITE_INTERVAL_MS) {
          lastFrameWriteAt = now;
          Camera.updateOne({ _id: camera._id }, { $set: { lastFrameAt: new Date() } }).catch(
            (err) => logger.warn({ err, cameraId }, '[ingest] lastFrameAt yazilamadi')
          );
        }
        return;
      }

      // --- Metin mesaji: kontrol ---
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        logger.warn({ cameraId }, '[ingest] cozumlenemeyen kontrol mesaji');
        return;
      }

      if (msg.type === 'hello') {
        await Camera.updateOne(
          { _id: camera._id },
          {
            $set: {
              agentModel: String(msg.model ?? '').slice(0, 120),
              agentVersion: String(msg.version ?? '').slice(0, 40),
            },
          }
        );
        logger.info({ cameraId, model: msg.model }, '[ingest] ajan tanitildi');
        return;
      }

      if (msg.type === 'event') {
        // Ajan tarafinda hareket algilandi.
        const type = Object.values(CAMERA_EVENT_TYPE).includes(msg.event)
          ? msg.event
          : CAMERA_EVENT_TYPE.MOTION;
        try {
          const created = await CameraEvent.create({
            farm: camera.farm,
            camera: camera._id,
            type,
            occurredAt: new Date(),
          });
          emitToFarm(farmId, SOCKET_EVENTS.CAMERA_EVENT_NEW, {
            id: String(created._id),
            cameraId,
            cameraName: camera.name,
            type,
            occurredAt: created.occurredAt,
          });
        } catch (err) {
          logger.warn({ err, cameraId }, '[ingest] kamera olayi yazilamadi');
        }
      }
    });

    // Sessizce olen baglantilari (guc kesintisi, kablo cikmasi) tespit et.
    const heartbeat = setInterval(() => {
      if (!alive) {
        logger.info({ cameraId }, '[ingest] ajan yanit vermiyor, baglanti kapatiliyor');
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, HEARTBEAT_MS);

    ws.on('pong', () => {
      alive = true;
    });

    ws.on('close', () => {
      clearInterval(heartbeat);
      clearCamera(cameraId);
      logger.info({ cameraId, frameCount }, '[ingest] ajan baglantisi kapandi');
    });

    ws.on('error', (err) => {
      logger.warn({ err, cameraId }, '[ingest] ajan baglanti hatasi');
    });

    // Dinleyiciler hazir; duraklatilan mesajlar simdi islenebilir.
    ws.resume();
  });

  wireStatusEvents();
  startFrameSweeper();

  logger.info(`[ingest] Kamera kabul kanali hazir -> ${INGEST_PATH}`);
  return wss;
}

export function stopCameraIngest() {
  stopFrameSweeper();
  if (!wss) return;
  for (const client of wss.clients) client.terminate();
  wss.close();
  wss = null;
}

export default { initCameraIngest, stopCameraIngest, INGEST_PATH };
