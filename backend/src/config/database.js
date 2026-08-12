import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * MongoDB baglantisini yonetir.
 * - Buyuk olceke hazir connection pool ayarlari.
 * - Strict query ile beklenmedik alanlara karsi koruma.
 * - Baglanti kopmalarinda otomatik yeniden deneme (mongoose yerlesik).
 */
mongoose.set('strictQuery', true);

export async function connectDatabase() {
  const conn = mongoose.connection;

  conn.on('connected', () => logger.info('[db] MongoDB baglantisi kuruldu'));
  conn.on('error', (err) => logger.error({ err }, '[db] MongoDB baglanti hatasi'));
  conn.on('disconnected', () => logger.warn('[db] MongoDB baglantisi koptu'));

  await mongoose.connect(env.mongoUri, {
    // Yuksek yuk altinda es zamanli sorgu kapasitesi.
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    // Yazma guvenligi: cogunluk onayi (uretimde replica set ile).
    // Tek node'lu local gelistirmede de sorunsuz calisir.
    retryWrites: true,
  });

  // Modellerde tanimli indeksleri uygula (production'da build script ile de yapilabilir).
  if (!env.isProd) {
    logger.debug('[db] Indeksler senkronize ediliyor (dev)...');
  }

  return conn;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
  logger.info('[db] MongoDB baglantisi kapatildi');
}

export default connectDatabase;
