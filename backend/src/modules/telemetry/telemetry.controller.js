import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { ingestTelemetry } from './ingestion.service.js';
import Telemetry from './telemetry.model.js';
import { parseCursorPagination, buildCursorResult } from '../../common/http/pagination.js';
import CameraEvent from '../camera/cameraEvent.model.js';
import Alert from '../alert/alert.model.js';
import CropRecord from '../crop/cropRecord.model.js';
import Device from '../device/device.model.js';
import Animal from '../animal/animal.model.js';

/**
 * POST /telemetry/ingest
 * Cihaz kimligi deviceAuth ile dogrulanmis; body validate edilmis.
 * Hizli 202 yaniti doner (fire-and-forget degil; kritik yazim tamamlanir).
 */
export const ingest = catchAsync(async (req, res) => {
  const result = await ingestTelemetry(req.body, req.device, 'http');
  return sendSuccess(res, {
    status: 202,
    message: 'Telemetri alindi',
    data: {
      telemetryId: String(result.telemetryId),
      motionState: result.motionState,
      zoneId: result.zoneId ? String(result.zoneId) : null,
      zoneName: result.zoneName,
    },
  });
});

/**
 * GET /telemetry
 * Kullanici (JWT) icin telemetri gecmisi -- CURSOR (keyset) sayfalandirma.
 * Milyarlarca satirda skip kullanmadan sabit hizda ilerler.
 * Sorgu her zaman kullanicinin ciftligiyle (farm) sinirlanir (yetki izolasyonu).
 */
export const list = catchAsync(async (req, res) => {
  const q = req.validQuery || req.query;
  const farmId = req.auth.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');

  const filter = { 'meta.farm': new mongoose.Types.ObjectId(farmId) };
  if (q.animalId) filter['meta.animal'] = new mongoose.Types.ObjectId(q.animalId);
  if (q.deviceId) filter['meta.device'] = new mongoose.Types.ObjectId(q.deviceId);
  if (q.from || q.to) {
    filter.ts = {};
    if (q.from) filter.ts.$gte = new Date(q.from);
    if (q.to) filter.ts.$lte = new Date(q.to);
  }

  const { limit, cursorFilter, sort } = parseCursorPagination(q);
  const finalFilter = { ...filter, ...cursorFilter };

  // limit + 1 cek -> sonraki sayfa var mi anla.
  const docs = await Telemetry.find(finalFilter)
    .sort(sort)
    .limit(limit + 1)
    .lean();

  const { items, meta } = buildCursorResult(docs, limit);
  return sendSuccess(res, { data: items, meta });
});


/**
 * GET /telemetry/sync-status
 * Mobil "Veri Senkronizasyonu" ekrani: bugun islenen kayit sayilari, kategori
 * kirilimi, son senkronizasyon zamani ve bekleyen (cevrimdisi) cihazlar.
 *
 * "Bekleyen", kuyruk uzunlugu degil; son 45 dk icinde veri gondermemis cihaz
 * sayisidir — yani gercekten senkron olmayi bekleyen kaynaklar.
 */
export const syncStatus = catchAsync(async (req, res) => {
  const farmId = req.auth.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  const farm = new mongoose.Types.ObjectId(farmId);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offlineThreshold = new Date(now.getTime() - 45 * 60 * 1000);

  const [telemetryToday, cameraEventsToday, alertsToday, cropToday, lastDevice, offlineDevices, animalsUpdated] =
    await Promise.all([
      Telemetry.countDocuments({ 'meta.farm': farm, ts: { $gte: startOfToday } }),
      CameraEvent.countDocuments({ farm, occurredAt: { $gte: startOfToday } }),
      Alert.countDocuments({ farm, createdAt: { $gte: startOfToday } }),
      CropRecord.countDocuments({ farm, updatedAt: { $gte: startOfToday } }),
      Device.findOne({ farm }).sort({ lastSeenAt: -1 }).select('lastSeenAt').lean(),
      Device.countDocuments({ farm, lastSeenAt: { $lt: offlineThreshold } }),
      Animal.countDocuments({ farm, updatedAt: { $gte: startOfToday } }),
    ]);

  const total = telemetryToday + cameraEventsToday + alertsToday + cropToday + animalsUpdated;

  const timeLabel = (date) =>
    date
      ? new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '—';

  return sendSuccess(res, {
    data: {
      lastSyncAt: lastDevice?.lastSeenAt ?? null,
      totals: {
        today: total,
        pending: offlineDevices,
        success: total,
        failed: 0,
      },
      categories: [
        { name: 'Sürü Verileri', count: animalsUpdated, unit: 'kayıt', at: startOfToday },
        { name: 'Tarla & Mahsul Verileri', count: cropToday, unit: 'kayıt', at: startOfToday },
        { name: 'Tasma Verileri', count: telemetryToday, unit: 'kayıt', at: lastDevice?.lastSeenAt ?? null },
        { name: 'Kamera Kayıtları', count: cameraEventsToday, unit: 'olay', at: startOfToday },
        { name: 'Sistem Logları', count: alertsToday, unit: 'kayıt', at: startOfToday },
      ].map((c) => ({ ...c, timeLabel: timeLabel(c.at) })),
    },
  });
});

export default { ingest, list, syncStatus };
