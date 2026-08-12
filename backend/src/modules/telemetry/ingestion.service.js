import Telemetry from './telemetry.model.js';
import Device from '../device/device.model.js';
import Animal from '../animal/animal.model.js';
import { resolveZone } from './positioning.service.js';
import { computeMagnitude, classifyMotion } from './motion.js';
import { raiseAlert } from '../alert/alert.service.js';
import { triggerCameraForZone } from '../camera/cameraTrigger.service.js';
import { emitToFarm } from '../../realtime/socket.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import {
  SOCKET_EVENTS,
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_SOURCE,
  MOTION_STATE,
} from '../../common/constants.js';

/**
 * VERI KABUL (INGESTION) ORKESTRASYONU.
 *
 * ESP32'den gelen tek bir telemetri paketini bastan sona isler:
 *  1) Ivme buyuklugu + hareket durumu (sunucu tarafi dogrulama).
 *  2) Konumlandirma motoru ile bolge tespiti.
 *  3) Telemetriyi time-series koleksiyona yaz (append-only).
 *  4) Cihaz durumunu guncelle (pil, son gorulme).
 *  5) Hayvanin anlik durumunu guncelle; bolge degistiyse olay yayinla.
 *  6) Esik kontrolleri: dusuk pil / anormal ivme -> alarm (+ kamera tetikle).
 *  7) Gercek zamanli "telemetry:new" yayini.
 *
 * @param {object} payload - dogrulanmis telemetri (validate middleware'den).
 * @param {object} device  - deviceAuth ile dogrulanmis cihaz dokumani.
 * @param {'http'|'mqtt'} via
 */
export async function ingestTelemetry(payload, device, via = 'http') {
  const farm = device.farm;
  const animalId = device.assignedAnimal || null;

  // 1) Hareket / ivme.
  const accel = payload.accel || {};
  const magnitude = Number.isFinite(accel.magnitude) ? accel.magnitude : computeMagnitude(accel);
  const motionState =
    payload.motionState && payload.motionState !== MOTION_STATE.UNKNOWN
      ? payload.motionState
      : classifyMotion(magnitude);

  // 2) Konumlandirma.
  const { zoneId, zoneName, rssi } = await resolveZone(farm, payload.rssiScans);

  // 3) Telemetri yaz (append-only, time-series).
  const ts = payload.ts ? new Date(payload.ts) : new Date();
  const doc = await Telemetry.create({
    ts,
    meta: { farm, device: device._id, animal: animalId, mac: device.macAddress },
    accel: { x: accel.x, y: accel.y, z: accel.z, magnitude },
    motionState,
    battery: payload.battery,
    rssiScans: payload.rssiScans || [],
    detectedZone: zoneId || undefined,
    detectedZoneRssi: rssi ?? undefined,
    ingestedVia: via,
  });

  // 4) Cihaz durumunu guncelle.
  const deviceUpdate = { lastSeenAt: ts };
  if (Number.isFinite(payload.battery)) {
    deviceUpdate.batteryLevel = payload.battery;
    deviceUpdate.lastBatteryReportAt = ts;
  }
  await Device.updateOne({ _id: device._id }, { $set: deviceUpdate });

  // 5) Hayvan anlik durumu + bolge degisimi.
  let zoneChanged = false;
  if (animalId) {
    const animal = await Animal.findById(animalId).select('currentZone farm');
    if (animal) {
      const prevZone = animal.currentZone ? String(animal.currentZone) : null;
      const newZone = zoneId ? String(zoneId) : prevZone; // tespit yoksa eskisini koru

      const update = { lastMotionState: motionState, lastSeenAt: ts };
      if (zoneId && newZone !== prevZone) {
        update.currentZone = zoneId;
        zoneChanged = true;
      }
      await Animal.updateOne({ _id: animalId }, { $set: update });

      if (zoneChanged) {
        emitToFarm(farm, SOCKET_EVENTS.ANIMAL_ZONE_CHANGED, {
          animalId: String(animalId),
          fromZone: prevZone,
          toZone: newZone,
          zoneName,
          at: ts.toISOString(),
        });
      }
    }
  }

  // 6) Esik kontrolleri.
  await runThresholdChecks({ farm, device, animalId, zoneId, battery: payload.battery, magnitude });

  // 7) Gercek zamanli telemetri yayini (dashboard/canli izleme).
  emitToFarm(farm, SOCKET_EVENTS.TELEMETRY_NEW, {
    telemetryId: String(doc._id),
    deviceId: String(device._id),
    animalId: animalId ? String(animalId) : null,
    mac: device.macAddress,
    motionState,
    magnitude,
    battery: payload.battery ?? null,
    zoneId: zoneId ? String(zoneId) : null,
    zoneName: zoneName || null,
    ts: ts.toISOString(),
  });

  return { telemetryId: doc._id, motionState, zoneId, zoneName, magnitude };
}

/**
 * Dusuk pil ve anormal ivme esiklerini kontrol eder; gerekirse alarm uretir
 * ve anormal harekette kamera tetikler.
 */
async function runThresholdChecks({ farm, device, animalId, zoneId, battery, magnitude }) {
  // Dusuk pil.
  if (Number.isFinite(battery) && battery <= env.LOW_BATTERY_THRESHOLD) {
    await raiseAlert({
      farm,
      type: ALERT_TYPE.LOW_BATTERY,
      source: ALERT_SOURCE.DEVICE,
      severity: battery <= 5 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH,
      message: `Tasma pili dusuk: %${battery} (${device.macAddress})`,
      device: device._id,
      animal: animalId,
      context: { battery },
      dedupeKey: `${ALERT_TYPE.LOW_BATTERY}:${device._id}`,
    }).catch((err) => logger.error({ err }, '[ingest] dusuk pil alarmi hatasi'));
  }

  // Anormal ivme -> alarm + kamera tetikleme.
  if (Number.isFinite(magnitude) && magnitude >= env.ABNORMAL_ACCEL_THRESHOLD) {
    const { isNew } = await raiseAlert({
      farm,
      type: ALERT_TYPE.ABNORMAL_MOTION,
      source: ALERT_SOURCE.HERD,
      severity: ALERT_SEVERITY.CRITICAL,
      message: `Anormal hareket tespit edildi (ivme ~${magnitude.toFixed(2)}g)`,
      device: device._id,
      animal: animalId,
      zone: zoneId,
      context: { magnitude },
      dedupeKey: `${ALERT_TYPE.ABNORMAL_MOTION}:${animalId || device._id}`,
    }).catch((err) => {
      logger.error({ err }, '[ingest] anormal hareket alarmi hatasi');
      return { isNew: false };
    });

    // Yalnizca yeni alarmda kamera ac (tekrar tekrar acmayi onle).
    if (isNew && zoneId) {
      await triggerCameraForZone({
        farm,
        zoneId,
        animalId,
        reason: ALERT_TYPE.ABNORMAL_MOTION,
      }).catch((err) => logger.error({ err }, '[ingest] kamera tetikleme hatasi'));
    }
  }
}

export default { ingestTelemetry };
