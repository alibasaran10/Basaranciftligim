import pino from 'pino';
import { env } from './env.js';

/**
 * Uygulama genelinde tek bir yapisal (structured) logger.
 * - development'ta okunabilir/renkli cikti (pino-pretty)
 * - production'da JSON (log toplayicilara uygun)
 * - hassas alanlar (parola, token, apiKey) otomatik maskelenir.
 */
export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-device-key"]',
      'password',
      'passwordConfirm',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      '*.password',
      '*.apiKey',
    ],
    censor: '[GIZLI]',
  },
  transport: env.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
});

export default logger;
