/**
 * MAC adresi yardimcilari.
 * Cihazlardan gelen MAC'ler farkli bicimlerde olabilir (buyuk/kucuk harf,
 * ":" veya "-" ayirici). Tutarli sekilde normalize ederiz: kucuk harf, ":".
 */
const MAC_REGEX = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/;

export function normalizeMac(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().toLowerCase().replace(/-/g, ':');
  // Ayirici yoksa (aabbccddeeff) araya ":" ekle.
  const compact = cleaned.replace(/:/g, '');
  if (!/^[0-9a-f]{12}$/.test(compact)) {
    return MAC_REGEX.test(cleaned) ? cleaned : null;
  }
  const withColons = compact.match(/.{2}/g).join(':');
  return MAC_REGEX.test(withColons) ? withColons : null;
}

export function isValidMac(value) {
  return normalizeMac(value) !== null;
}

export default { normalizeMac, isValidMac };
