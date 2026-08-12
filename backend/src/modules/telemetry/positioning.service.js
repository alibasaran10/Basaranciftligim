import { env } from '../../config/env.js';
import Zone from '../zone/zone.model.js';
import { normalizeMac } from '../../common/utils/mac.js';

/**
 * KONUMLANDIRMA MOTORU (Mantiksal Katman).
 *
 * Girdi: tasmanin taradigi Access Point'ler [{ bssid, rssi }].
 * Cikti: hayvanin buyuk olasilikla bulundugu bolge.
 *
 * Yontem: Her bolgenin tanimli routerMacs (AP MAC) listesi vardir. Gelen
 * taramadaki AP'lerden bolgeye ait olanlarin RSSI degerleri toplanir; en
 * guclu (en az negatif) sinyale sahip bolge secilir. Minimum esik altindaki
 * sinyaller "cok uzak" sayilarak yok sayilir.
 *
 * Bu, altyapi gerektirmeyen, hizli ve pratik bir "AP-parmak izi" yaklasimidir.
 * Daha hassas konum icin Python analiz servisinde trilaterasyon/ML uygulanabilir.
 */

// Basit bir bolge onbellegi (AP MAC -> zoneId). Bolgeler sik degismez;
// her telemetride DB'ye gitmemek icin kisa sureli cache.
const CACHE_TTL_MS = 30_000;
const cache = new Map(); // farmId -> { at, apMap: Map<mac, {zoneId, zoneName}> }

async function getZoneApMap(farmId) {
  const key = String(farmId);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.apMap;

  const zones = await Zone.find({ farm: farmId, isActive: true })
    .select('_id name routerMacs')
    .lean();

  const apMap = new Map();
  for (const zone of zones) {
    for (const mac of zone.routerMacs || []) {
      apMap.set(mac, { zoneId: zone._id, zoneName: zone.name });
    }
  }
  cache.set(key, { at: Date.now(), apMap });
  return apMap;
}

/** Bolge tanimlari degistiginde cache'i temizler (zone servisinden cagrilir). */
export function invalidatePositioningCache(farmId) {
  if (farmId) cache.delete(String(farmId));
  else cache.clear();
}

/**
 * @returns {Promise<{ zoneId: ObjectId|null, zoneName: string|null, rssi: number|null }>}
 */
export async function resolveZone(farmId, rssiScans = []) {
  if (!Array.isArray(rssiScans) || rssiScans.length === 0) {
    return { zoneId: null, zoneName: null, rssi: null };
  }

  const apMap = await getZoneApMap(farmId);
  if (apMap.size === 0) return { zoneId: null, zoneName: null, rssi: null };

  // Bolge basina en guclu sinyali biriktir.
  const perZone = new Map(); // zoneId -> { zoneName, bestRssi, sumRssi, count }

  for (const scan of rssiScans) {
    const mac = normalizeMac(scan?.bssid);
    const rssi = Number(scan?.rssi);
    if (!mac || !Number.isFinite(rssi)) continue;
    if (rssi < env.POSITIONING_MIN_RSSI) continue; // cok zayif -> yok say

    const zoneRef = apMap.get(mac);
    if (!zoneRef) continue;

    const id = String(zoneRef.zoneId);
    const agg = perZone.get(id) || { zoneName: zoneRef.zoneName, bestRssi: -Infinity, sumRssi: 0, count: 0 };
    agg.bestRssi = Math.max(agg.bestRssi, rssi);
    agg.sumRssi += rssi;
    agg.count += 1;
    perZone.set(id, agg);
  }

  if (perZone.size === 0) return { zoneId: null, zoneName: null, rssi: null };

  // En guclu bolgeyi sec: once en yuksek bestRssi, esitlikte daha cok AP goreni.
  let winnerId = null;
  let winner = null;
  for (const [id, agg] of perZone.entries()) {
    if (
      !winner ||
      agg.bestRssi > winner.bestRssi ||
      (agg.bestRssi === winner.bestRssi && agg.count > winner.count)
    ) {
      winner = agg;
      winnerId = id;
    }
  }

  return { zoneId: winnerId, zoneName: winner.zoneName, rssi: winner.bestRssi };
}

export default { resolveZone, invalidatePositioningCache };
