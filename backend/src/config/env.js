import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Ortam degiskenlerini merkezi ve dogrulanmis sekilde yukler.
 * Eksik/hatali bir degisken varsa uygulama daha baslamadan (fail-fast)
 * anlasilir bir hatayla durur. Boylece production'da sessiz hatalar olmaz.
 */
const boolFromString = (def) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : v === 'true' || v === '1'));

const csv = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI zorunludur'),
  MONGODB_URI_TEST: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET en az 16 karakter olmali'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET en az 16 karakter olmali'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  DEVICE_INGEST_API_KEY: z.string().min(8, 'DEVICE_INGEST_API_KEY zorunludur'),

  CORS_ORIGINS: csv,

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  INGEST_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),

  MQTT_ENABLED: boolFromString(false),
  MQTT_URL: z.string().default('mqtt://127.0.0.1:1883'),
  MQTT_USERNAME: z.string().optional().default(''),
  MQTT_PASSWORD: z.string().optional().default(''),
  MQTT_TELEMETRY_TOPIC: z.string().default('farm/+/device/+/telemetry'),
  MQTT_CLIENT_ID: z.string().default('smart-farm-backend'),

  POSITIONING_MIN_RSSI: z.coerce.number().default(-85),
  LOW_BATTERY_THRESHOLD: z.coerce.number().min(0).max(100).default(20),
  ABNORMAL_ACCEL_THRESHOLD: z.coerce.number().positive().default(2.5),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(5),

  ANALYTICS_SERVICE_URL: z.string().optional().default(''),
  ANALYTICS_SERVICE_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Uygulama baslamadan once net bir hata mesaji ver.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[env] Ortam degiskenleri gecersiz:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  isDev: raw.NODE_ENV === 'development',
  mongoUri: raw.NODE_ENV === 'test' && raw.MONGODB_URI_TEST ? raw.MONGODB_URI_TEST : raw.MONGODB_URI,
  maxUploadBytes: raw.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
};

export default env;
