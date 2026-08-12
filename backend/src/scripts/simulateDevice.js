/**
 * ESP32 tasmasini simule eder: periyodik olarak HTTP POST ile telemetri gonderir.
 * Kullanim:
 *   MAC=aa:bb:cc:dd:ee:01 KEY=<apiKey> npm run simulate
 * Opsiyonel: BASE=http://localhost:4000/api/v1  INTERVAL=3000
 *
 * (seed ciktisi MAC + KEY degerlerini verir.)
 */
const BASE = process.env.BASE || 'http://localhost:4000/api/v1';
const MAC = process.env.MAC;
const KEY = process.env.KEY;
const INTERVAL = Number(process.env.INTERVAL || 5000);

if (!MAC || !KEY) {
  // eslint-disable-next-line no-console
  console.error('MAC ve KEY ortam degiskenleri zorunlu. Ornek:');
  // eslint-disable-next-line no-console
  console.error('  MAC=aa:bb:cc:dd:ee:01 KEY=... npm run simulate');
  process.exit(1);
}

// Ornek AP'ler: Saginhane (guclu) ve Ahir.
const APS = [
  { bssid: 'aa:bb:cc:00:00:03', base: -55 }, // Saginhane
  { bssid: 'aa:bb:cc:00:00:01', base: -75 }, // Ahir
];

function jitter(v, amount) {
  return v + (Math.random() * 2 - 1) * amount;
}

function buildPacket() {
  // Zaman zaman anormal ivme uret (kamera tetiklemeyi test icin).
  const abnormal = Math.random() < 0.15;
  const mag = abnormal ? jitter(3.0, 0.5) : jitter(1.0, 0.2);
  return {
    mac: MAC,
    ts: new Date().toISOString(),
    accel: {
      x: jitter(0, 0.3),
      y: jitter(0, 0.3),
      z: jitter(mag, 0.2),
      magnitude: Math.abs(mag),
    },
    battery: Math.max(1, Math.round(jitter(60, 5))),
    rssiScans: APS.map((ap) => ({ bssid: ap.bssid, rssi: Math.round(jitter(ap.base, 4)) })),
  };
}

async function tick() {
  const packet = buildPacket();
  try {
    const res = await fetch(`${BASE}/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-key': KEY },
      body: JSON.stringify(packet),
    });
    const json = await res.json();
    // eslint-disable-next-line no-console
    console.log(res.status, JSON.stringify(json.data || json.error));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Gonderim hatasi:', err.message);
  }
}

// eslint-disable-next-line no-console
console.log(`Simulasyon basladi -> ${BASE} (her ${INTERVAL}ms)`);
tick();
setInterval(tick, INTERVAL);
