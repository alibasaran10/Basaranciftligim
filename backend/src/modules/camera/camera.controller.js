import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import Camera from './camera.model.js';
import CameraEvent from './cameraEvent.model.js';
import { isOnline as hasLiveFeed, getLatestFrame } from './frameStore.js';
import { CAMERA_EVENT_TYPE } from '../../common/constants.js';
import {
  parseOffsetPagination,
  buildOffsetMeta,
} from '../../common/http/pagination.js';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

export const EVENT_LABELS = Object.freeze({
  [CAMERA_EVENT_TYPE.MOTION]: 'Hareket Algılandı',
  [CAMERA_EVENT_TYPE.OFFLINE]: 'Hat Dışı',
  [CAMERA_EVENT_TYPE.RECORDING]: 'Kayıt Başlatıldı',
  [CAMERA_EVENT_TYPE.ANIMAL_DETECTED]: 'Hayvan Tespiti',
});

// Son karesi bu esikten eski olan kamera "cevrimdisi" sayilir.
const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;

function timeLabel(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function present(camera) {
  // "live": saha ajani su AN kare gonderiyor --- panel canli goruntu acabilir.
  // "online": kamera genel olarak calisir durumda. Ajan yeni kopmus ya da
  // sunucu yeni baslamis olabilecegi icin son kare zamanina da bakilir;
  // boylece kisa kesintilerde kamera listesi bos yere kirmiziya donmez.
  const live = camera.isActive && hasLiveFeed(camera._id);
  const online =
    live ||
    (camera.isActive &&
      !!camera.lastFrameAt &&
      Date.now() - new Date(camera.lastFrameAt).getTime() < OFFLINE_THRESHOLD_MS);

  const frame = live ? getLatestFrame(camera._id) : null;

  return {
    id: String(camera._id),
    name: camera.name,
    group: camera.group || 'Genel',
    location: camera.location || camera.zone?.name || '—',
    zoneName: camera.zone?.name ?? null,
    snapshotUrl: camera.snapshotUrl || null,
    online,
    live,
    statusLabel: live ? 'Canlı Yayında' : online ? 'Çevrimiçi' : 'Çevrimdışı',
    isRecording: online && !!camera.isRecording,
    recordingLabel: online && camera.isRecording ? 'Kayıt Yapıyor' : 'Kayıt Yok',
    // Canli akis varsa son karenin geldigi an, yoksa DB'deki son kayit.
    lastFrameAt: frame ? new Date(frame.receivedAt) : (camera.lastFrameAt ?? null),
    lastFrameLabel: timeLabel(frame ? new Date(frame.receivedAt) : camera.lastFrameAt),
    source: camera.source ?? null,
    agentModel: camera.agentModel ?? null,
    // Ajan hic baglanmadiysa panel "kurulum gerekli" uyarisi gosterebilir.
    hasAgentKey: Boolean(camera.agentConnectedAt),
  };
}

/**
 * GET /cameras/overview
 * Kamera ekraninin tamami: canli izleme kartlari, kamera listesi,
 * grup sayaclari ve son olaylar.
 */
export const overview = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);

  const [cameras, events] = await Promise.all([
    Camera.find({ farm }).populate('zone', 'name').sort({ name: 1 }).lean(),
    CameraEvent.find({ farm })
      .sort({ occurredAt: -1 })
      .limit(6)
      .populate('camera', 'name snapshotUrl')
      .lean(),
  ]);

  const presented = cameras.map(present);

  // Grup sayaclari ("Tümü · 12", "Ahırlar · 4"...).
  const groupCounts = new Map();
  for (const cam of presented) {
    groupCounts.set(cam.group, (groupCounts.get(cam.group) ?? 0) + 1);
  }

  return sendSuccess(res, {
    data: {
      totals: {
        total: presented.length,
        online: presented.filter((c) => c.online).length,
        live: presented.filter((c) => c.live).length,
        recording: presented.filter((c) => c.isRecording).length,
        offline: presented.filter((c) => !c.online).length,
        lastSync: presented.reduce(
          (latest, c) => (c.lastFrameAt && (!latest || c.lastFrameAt > latest) ? c.lastFrameAt : latest),
          null
        ),
      },
      cameras: presented,
      groups: [
        { name: 'Tümü', count: presented.length },
        ...[...groupCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
      ],
      events: events.map((e) => ({
        id: String(e._id),
        type: e.type,
        typeLabel: EVENT_LABELS[e.type] ?? 'Olay',
        cameraName: e.camera?.name ?? '—',
        thumbnailUrl: e.thumbnailUrl || e.camera?.snapshotUrl || null,
        occurredAt: e.occurredAt,
        timeLabel: timeLabel(e.occurredAt),
      })),
    },
  });
});

/** GET /cameras/events */
export const listEvents = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { page, limit, skip } = parseOffsetPagination(req.query);

  const filter = { farm };
  if (req.query.camera) filter.camera = String(req.query.camera);
  if (req.query.type) filter.type = String(req.query.type);
  if (req.query.days) {
    filter.occurredAt = { $gte: new Date(Date.now() - Number(req.query.days) * 86400000) };
  }

  const [items, total] = await Promise.all([
    CameraEvent.find(filter)
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('camera', 'name group')
      .lean(),
    CameraEvent.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: items.map((e) => ({
      id: String(e._id),
      type: e.type,
      typeLabel: EVENT_LABELS[e.type] ?? 'Olay',
      cameraName: e.camera?.name ?? '—',
      group: e.camera?.group ?? '—',
      occurredAt: e.occurredAt,
      timeLabel: timeLabel(e.occurredAt),
      durationSeconds: e.durationSeconds ?? null,
      thumbnailUrl: e.thumbnailUrl ?? null,
    })),
    meta: buildOffsetMeta({ page, limit, total }),
  });
});

export default { overview, listEvents };
