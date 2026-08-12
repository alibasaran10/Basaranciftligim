import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Python Analiz Mikroservisi istemcisi.
 * Node ingestion hatti HIZLI kalir; agir/gelismis analiz istenirse bu servise
 * devredilir. Servis tanimli degilse veya hata verirse cagiran taraf kendi
 * yerel (Node) hesaplamasina duser (graceful degradation).
 */
const ENABLED = Boolean(env.ANALYTICS_SERVICE_URL);

async function post(path, body, timeoutMs = 3000) {
  if (!ENABLED) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${env.ANALYTICS_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': env.ANALYTICS_SERVICE_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn({ path, status: res.status }, '[analytics] servis hata dondu');
      return null;
    }
    return await res.json();
  } catch (err) {
    logger.warn({ path, err: err.message }, '[analytics] servise ulasilamadi, yerel hesaplamaya donuluyor');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const analyticsClient = {
  enabled: ENABLED,
  resolvePosition: (payload) => post('/positioning/resolve', payload),
  classifyMotion: (payload) => post('/motion/classify', payload),
  analyzeYield: (payload) => post('/yield/analyze', payload),
};

export default analyticsClient;
