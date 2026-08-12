import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyAccessToken } from '../common/security/tokens.js';

/**
 * Gercek zamanli katman (Socket.IO).
 * Frontend'e telemetri, bolge degisimi, alarm ve "kamerayi ac" komutlarini
 * anlik iletir. Odalar (rooms) ciftlik bazlidir: her kullanici yalnizca kendi
 * ciftliginin olaylarini alir (yetki izolasyonu).
 */
let io = null;

export function initRealtime(httpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : false,
      credentials: true,
    },
    // Buyuk olcekte birden fazla node icin Redis adapter takilabilir.
  });

  // Baglanti oncesi JWT dogrulama (yetkisiz dinlemeyi engelle).
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      socket.data.farmId = payload.farm || null;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { farmId, userId } = socket.data;
    if (farmId) socket.join(farmRoom(farmId));
    logger.debug({ userId, farmId }, '[socket] baglanti kuruldu');

    socket.on('disconnect', () => {
      logger.debug({ userId }, '[socket] baglanti kapandi');
    });
  });

  logger.info('[socket] Gercek zamanli katman hazir');
  return io;
}

export function farmRoom(farmId) {
  return `farm:${farmId}`;
}

/**
 * Bir ciftligin tum bagli istemcilerine olay yayinlar.
 * io henuz baslamadiysa sessizce gecer (test/CLI baglami).
 */
export function emitToFarm(farmId, event, payload) {
  if (!io || !farmId) return;
  io.to(farmRoom(String(farmId))).emit(event, payload);
}

export function getIO() {
  return io;
}

export default { initRealtime, emitToFarm, farmRoom, getIO };
