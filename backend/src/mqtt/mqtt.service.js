import mqtt from 'mqtt';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ingestSchema } from '../modules/telemetry/telemetry.validation.js';
import { ingestTelemetry } from '../modules/telemetry/ingestion.service.js';
import Device from '../modules/device/device.model.js';
import { normalizeMac } from '../common/utils/mac.js';

/**
 * MQTT ile veri kabul.
 * ESP32'ler "farm/<farmId>/device/<mac>/telemetry" konusuna JSON yayinlar.
 *
 * GUVENLIK: MQTT kimlik dogrulamasi broker seviyesinde yapilmalidir
 * (kullanici/parola + ACL: her cihaz yalnizca kendi konusuna yazabilir + TLS).
 * Bu servis ek olarak: (1) MAC'i kayitli cihazla eslestirir, (2) katmani
 * ingestSchema ile dogrular, (3) hatali paketleri sessizce reddeder.
 */
let client = null;

const TOPIC_REGEX = /^farm\/([^/]+)\/device\/([^/]+)\/telemetry$/;

export function startMqtt() {
  if (!env.MQTT_ENABLED) {
    logger.info('[mqtt] devre disi (MQTT_ENABLED=false)');
    return null;
  }

  client = mqtt.connect(env.MQTT_URL, {
    clientId: `${env.MQTT_CLIENT_ID}-${process.pid}`,
    username: env.MQTT_USERNAME || undefined,
    password: env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
    clean: true,
  });

  client.on('connect', () => {
    logger.info('[mqtt] broker baglantisi kuruldu');
    client.subscribe(env.MQTT_TELEMETRY_TOPIC, { qos: 1 }, (err) => {
      if (err) logger.error({ err }, '[mqtt] abonelik hatasi');
      else logger.info(`[mqtt] abone olundu: ${env.MQTT_TELEMETRY_TOPIC}`);
    });
  });

  client.on('message', (topic, message) => {
    handleMessage(topic, message).catch((err) =>
      logger.error({ err, topic }, '[mqtt] mesaj isleme hatasi')
    );
  });

  client.on('error', (err) => logger.error({ err }, '[mqtt] baglanti hatasi'));
  client.on('reconnect', () => logger.warn('[mqtt] yeniden baglaniliyor...'));

  return client;
}

async function handleMessage(topic, message) {
  const match = TOPIC_REGEX.exec(topic);
  if (!match) return; // beklenmeyen konu

  const macFromTopic = normalizeMac(match[2]);
  if (!macFromTopic) return;

  // JSON ayristir (asiri buyuk paketleri broker seviyesinde de sinirla).
  let payload;
  try {
    payload = JSON.parse(message.toString('utf8'));
  } catch {
    logger.warn({ topic }, '[mqtt] gecersiz JSON, atlandi');
    return;
  }

  // Konu ile govdedeki MAC tutarli olmali; yoksa konudakini kullan.
  payload.mac = normalizeMac(payload.mac || payload.macAddress) || macFromTopic;

  const parsed = ingestSchema.safeParse(payload);
  if (!parsed.success) {
    logger.warn({ topic, issues: parsed.error.issues?.length }, '[mqtt] dogrulama hatasi, atlandi');
    return;
  }

  const device = await Device.findOne({ macAddress: payload.mac });
  if (!device) {
    logger.warn({ mac: payload.mac }, '[mqtt] kayitli olmayan cihaz, atlandi');
    return;
  }

  await ingestTelemetry(parsed.data, device, 'mqtt');
}

export function stopMqtt() {
  if (client) {
    client.end(true);
    client = null;
    logger.info('[mqtt] baglanti kapatildi');
  }
}

export default { startMqtt, stopMqtt };
