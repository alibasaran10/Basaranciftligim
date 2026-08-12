import http from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createApp } from './app.js';
import { initRealtime } from './realtime/socket.js';
import { initCameraIngest, stopCameraIngest } from './realtime/cameraIngest.js';
import { startMqtt, stopMqtt } from './mqtt/mqtt.service.js';

/**
 * Uygulama giris noktasi.
 * Sira: DB baglan -> HTTP + WebSocket + MQTT baslat -> zarif kapanis kur.
 */
async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  // Gercek zamanli katman (Socket.IO) ayni HTTP sunucusuna baglanir.
  initRealtime(server);

  // Saha ajanlarindan (Raspberry Pi) kamera karesi kabulu. Socket.IO ile
  // ayni sunucuyu paylasir; ayrisma "upgrade" yolunda yapilir. Socket.IO
  // once kurulmali ki kendi yolunu sahiplenmis olsun.
  initCameraIngest(server);

  // MQTT ile veri kabul (opsiyonel).
  startMqtt();

  server.listen(env.PORT, () => {
    logger.info(`[server] ${env.NODE_ENV} modunda calisiyor -> http://localhost:${env.PORT}${env.API_PREFIX}`);
  });

  // --- Zarif kapanis (graceful shutdown) ---
  const shutdown = async (signal) => {
    logger.info(`[server] ${signal} alindi, kapatiliyor...`);
    server.close(async () => {
      stopMqtt();
      stopCameraIngest();
      await disconnectDatabase();
      logger.info('[server] temiz kapandi');
      process.exit(0);
    });
    // 10 sn icinde kapanmazsa zorla.
    setTimeout(() => {
      logger.error('[server] zorla kapatildi (timeout)');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Yakalanmamis hatalar: logla ve guvenli sekilde cik.
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, '[server] unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, '[server] uncaughtException, kapatiliyor');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, '[server] baslatma hatasi');
  process.exit(1);
});
