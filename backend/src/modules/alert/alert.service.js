import Alert from './alert.model.js';
import { SOCKET_EVENTS, ALERT_STATUS, ALERT_SOURCE } from '../../common/constants.js';
import { emitToFarm } from '../../realtime/socket.js';
import { logger } from '../../config/logger.js';

/**
 * Alarm olusturma servisi.
 * - Dedupe: ayni (type + animal + gun) icin kisa surede tekrar alarm uretmez;
 *   var olan acik alarmi gunceller. Boylece dashboard alarm cop yigini olmaz.
 * - Olusan/guncellenen alarmi gercek zamanli olarak ciftlige yayinlar.
 */
const DEDUPE_WINDOW_MS = 10 * 60 * 1000; // 10 dk

export async function raiseAlert({
  farm,
  type,
  severity,
  message,
  title = undefined,
  source = ALERT_SOURCE.SYSTEM,
  animal = null,
  device = null,
  zone = null,
  camera = null,
  field = null,
  stockItem = null,
  assignedTo = null,
  assignedLabel = undefined,
  cameraVerified = false,
  imageUrl = undefined,
  context = undefined,
  dedupeKey = undefined,
}) {
  const key = dedupeKey || `${type}:${animal || device || field || stockItem || 'na'}`;

  // Son pencere icinde ayni anahtarla acik alarm var mi?
  const existing = await Alert.findOne({
    farm,
    dedupeKey: key,
    status: ALERT_STATUS.OPEN,
    createdAt: { $gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
  });

  if (existing) {
    existing.context = context ?? existing.context;
    existing.updatedAt = new Date();
    await existing.save();
    return { alert: existing, isNew: false };
  }

  const alert = await Alert.create({
    farm,
    type,
    source,
    severity,
    title,
    message,
    animal,
    device,
    zone,
    camera,
    field,
    stockItem,
    assignedTo,
    assignedLabel,
    cameraVerified,
    imageUrl,
    context,
    dedupeKey: key,
  });

  logger.info({ farm: String(farm), type, alert: String(alert._id) }, '[alert] yeni alarm');
  emitToFarm(farm, SOCKET_EVENTS.ALERT_NEW, alert.toJSON());

  return { alert, isNew: true };
}

export default { raiseAlert };
