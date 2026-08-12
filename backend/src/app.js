import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { ApiError } from './common/errors/ApiError.js';
import { globalLimiter } from './common/middlewares/rateLimiters.js';
import { notFound } from './common/middlewares/notFound.js';
import { errorHandler } from './common/middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

/**
 * Express uygulamasini olusturur ve GUVENLIK middleware yiginini kurar.
 *
 * Savunma katmanlari (defense-in-depth):
 *  - helmet: guvenli HTTP basliklari (XSS, clickjacking, MIME-sniffing vb.)
 *  - cors:   yalnizca beyaz listedeki origin'ler
 *  - body limit: buyuk govde ile bellek tuketimini onler
 *  - mongoSanitize: NoSQL operator enjeksiyonunu ($gt, $where...) temizler
 *  - hpp:    HTTP parametre kirliligini onler
 *  - rate limit: kaba-kuvvet / DoS
 *  - Zod validate (route'larda): girdi dogrulama + whitelist
 *  - xss temizligi (sanitize): stored-XSS'e karsi
 */
export function createApp() {
  const app = express();

  // Ters proxy (nginx) arkasinda dogru IP/protokol icin.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // --- Guvenli basliklar ---
  app.use(
    helmet({
      contentSecurityPolicy: env.isProd ? undefined : false, // API; CSP'yi frontend uygular
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );

  // --- CORS (beyaz liste) ---
  app.use(
    cors({
      origin(origin, cb) {
        // Sunucudan sunucuya / same-origin isteklerde origin olmayabilir.
        if (!origin || env.CORS_ORIGINS.length === 0 || env.CORS_ORIGINS.includes(origin)) {
          return cb(null, true);
        }
        return cb(new ApiError(403, 'CORS: origin izinli degil'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  // --- Govde ayristirma (boyut sinirli) ---
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));

  // --- Enjeksiyon / kirlilik temizligi ---
  // NoSQL operator anahtarlarini ($, .) temizler.
  app.use(mongoSanitize({ replaceWith: '_' }));
  // Yinelenen query parametrelerini tekillestirir.
  app.use(hpp());

  // --- Sikistirma ---
  app.use(compression());

  // --- Istek loglama ---
  app.use(
    morgan(env.isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.path === `${env.API_PREFIX}/health`,
    })
  );

  // --- Genel rate limit ---
  app.use(env.API_PREFIX, globalLimiter);

  // --- API route'lari ---
  app.use(env.API_PREFIX, apiRoutes);

  // --- 404 + merkezi hata yakalama ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
