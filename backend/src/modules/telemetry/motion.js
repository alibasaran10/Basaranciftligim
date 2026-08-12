import { MOTION_STATE } from '../../common/constants.js';

/**
 * Ivme buyuklugu ve basit hareket siniflandirmasi.
 * ESP32 zaten motionState gonderebilir; gondermezse veya dogrulamak icin
 * sunucu tarafinda da hesaplanir. (Asil/gelismis siniflandirma Python
 * analiz servisinde yapilabilir.)
 *
 * magnitude ~ 1g (9.81) civari => durgun/yatiyor; yuksek ve degisken => aktif/kosuyor.
 */
export function computeMagnitude(accel = {}) {
  const { x = 0, y = 0, z = 0 } = accel;
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Sensor 'g' biriminde varsayilir (1g ~ durgun). m/s^2 gonderiliyorsa
 * cihaz tarafinda g'ye cevrilmesi onerilir.
 */
export function classifyMotion(magnitudeG) {
  if (!Number.isFinite(magnitudeG)) return MOTION_STATE.UNKNOWN;
  if (magnitudeG < 0.85) return MOTION_STATE.LYING;
  if (magnitudeG <= 1.15) return MOTION_STATE.GRAZING; // ~1g, hafif hareket
  if (magnitudeG <= 2.0) return MOTION_STATE.ACTIVE;
  return MOTION_STATE.RUNNING;
}

export default { computeMagnitude, classifyMotion };
