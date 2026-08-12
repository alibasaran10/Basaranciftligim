# 🚜 Başaran Çiftliğim - Akıllı Çiftlik & Sürü Yönetim Platformu

ESP32 tabanlı akıllı tasmalar, RSSI ile bölge konumlandırma, canlı kamera tetikleme, tarla/verim yönetimi ve milyarlarca satırlık zaman serisi verisini kaldıracak şekilde tasarlanmış uçtan uca bir IoT platformu.

Bu depo üç ana bileşenden oluşur:

| Klasör | Teknoloji | Görevi |
|---|---|---|
| [`backend/`](backend/) | **Node.js + Express + MongoDB** | Ana API, veri kabul (ingestion), MQTT, konumlandırma, kamera tetikleme, gerçek zamanlı (WebSocket) |
| [`analytics-service/`](analytics-service/) | **Python + FastAPI + NumPy** | Gelişmiş analiz mikroservisi: RSSI konumlandırma, hareket sınıflandırma, verim analizi |
| [`firmware/`](firmware/) | **C++ / Arduino (ESP32)** | Tasma yazılımı: MPU6050, Wi‑Fi RSSI tarama, deep sleep, JSON+HTTP gönderim |

---

## 🏗️ Mimari

```
┌────────────┐   HTTP POST / MQTT     ┌─────────────────────────────┐
│  ESP32     │  (JSON: accel, RSSI,   │        Node.js Backend       │
│  Tasma     │──────  battery)  ─────▶│  ┌───────────────────────┐  │
│ (MPU6050)  │   x-device-key auth    │  │ Ingestion Orchestrator │  │
└────────────┘                        │  │  • konumlandırma motoru│  │
                                      │  │  • hareket sınıfland.  │  │
┌────────────┐   REST (x-service-key) │  │  • eşik/alarm          │  │
│  Python    │◀───── (opsiyonel) ─────│  │  • kamera tetikleme    │  │
│  Analytics │────── sonuç  ─────────▶│  └───────────┬───────────┘  │
└────────────┘                        │              │              │
                                      │        MongoDB (time-series) │
┌────────────┐   WebSocket (JWT)      │              │              │
│  Frontend  │◀───── olaylar ─────────│  Socket.IO ◀─┘              │
│ (React/Next)│  telemetry/alert/camera└─────────────────────────────┘
└────────────┘
```

**Neden MongoDB?** Milyarlarca akan sensör/log kaydı için **Time-Series Collection** (otomatik bucket'lama, TTL), esnek şema ve yatay ölçekleme (sharding). Telemetri `append-only` yazılır; sık sorgular `meta.animal + ts`, `meta.device + ts` bileşik indeksleriyle sabit hızda döner. Sayfalandırmada büyük veri için **cursor (keyset)**, yönetim ekranları için **offset** stratejisi kullanılır.

---

## 🚀 Hızlı Başlangıç

### Ön koşullar
- Node.js ≥ 18, MongoDB ≥ 6 (time-series için), Python ≥ 3.9

### 1) Backend (Node.js)

```bash
cd backend
cp .env.example .env          # değerleri doldurun (JWT secret'ları, DB URI...)
npm install
npm run seed                  # örnek veri + cihaz API anahtarları (çıktıyı saklayın)
npm run dev                   # http://localhost:4000/api/v1
```

Cihaz simülatörü (seed çıktısındaki MAC/KEY ile):

```bash
MAC=aa:bb:cc:dd:ee:01 KEY=<seed_ciktisi_anahtar> npm run simulate
```

### 2) Analiz Servisi (Python)

```bash
cd analytics-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # SERVICE_API_KEY, backend'deki ANALYTICS_SERVICE_KEY ile aynı olmalı
python -m app.main            # http://localhost:8000  (/docs açık)
```

### 3) Firmware (ESP32)

`firmware/smart_collar/smart_collar.ino` dosyasındaki `WIFI_*`, `INGEST_URL`, `DEVICE_API_KEY` alanlarını doldurup Arduino IDE ile ESP32'ye yükleyin.

---

## 📡 API Özeti (`/api/v1`)

| Method | Yol | Açıklama | Kimlik |
|---|---|---|---|
| GET | `/health` | Sağlık kontrolü | — |
| POST | `/auth/register` | Kayıt (kullanıcı + çiftlik) | — |
| POST | `/auth/login` | Giriş → access+refresh token | — |
| POST | `/auth/refresh` | Token yenileme | — |
| GET | `/auth/me` | Profil | JWT |
| POST | `/telemetry/ingest` | **Cihaz veri kabul** | `x-device-key` |
| GET | `/telemetry` | Telemetri geçmişi (cursor) | JWT |
| CRUD | `/animals` | Hayvanlar | JWT |
| CRUD | `/devices` | Cihazlar (+`/:id/assign`, `/:id/rotate-key`) | JWT |
| CRUD | `/zones` | Bölgeler (routerMacs) | JWT |
| CRUD | `/cameras` | Kameralar | JWT |
| CRUD | `/fields` | Tarlalar (+`/:id/operations`) | JWT |
| GET | `/alerts` | Alarmlar (+`/acknowledge`, `/resolve`) | JWT |
| GET | `/dashboard/summary` | Özet metrikler | JWT |

Tüm yanıtlar tek tip zarftadır: `{ success, data, meta?, error? }`.

### Gerçek zamanlı olaylar (Socket.IO)
`telemetry:new`, `animal:zoneChanged`, `alert:new`, `camera:open`, `device:status` — bağlantıda `auth.token` (JWT) gönderilir; her kullanıcı yalnızca kendi çiftliğinin odasına katılır.

---

## 🔐 Güvenlik

Katmanlı savunma (defense-in-depth) ile aşağıdaki zafiyetlere karşı önlem alınmıştır:

- **NoSQL/SQL injection:** `express-mongo-sanitize` ($, . operatör temizliği) + Zod ile katı şema doğrulama + `.strict()` whitelist.
- **XSS (stored):** girdi metinleri `xss` ile temizlenir; API JSON döner, `helmet` başlıkları uygulanır.
- **Command injection:** shell/exec kullanılmaz; kullanıcı girdisi hiçbir komuta geçmez.
- **File upload injection:** MIME+uzantı beyaz listesi, kriptografik rastgele dosya adı (path traversal engeli), boyut/sayı sınırı (`multer` 2.x).
- **Kimlik & yetki:** JWT (access+refresh, ayrı secret'lar, `tokenVersion` ile iptal), bcrypt (12 tur), rol tabanlı yetki (RBAC), **çiftlik-scope izolasyonu** (IDOR/BOLA koruması).
- **Cihaz kimliği:** cihaz başına API anahtarı (SHA‑256 hash olarak saklanır, sabit süreli karşılaştırma).
- **Kaba kuvvet/DoS:** genel + auth + ingestion için ayrı `rate limit`; gövde boyutu sınırı; `hpp` parametre kirliliği koruması.
- **Sır yönetimi:** `.env` git'e girmez; loglarda hassas alanlar maskelenir (`pino redact`).

> Üretim önerileri: HTTPS/TLS zorunlu, MQTT broker ACL + TLS, rate-limit için Redis store, kamera RTSP kimlik bilgilerinin secret manager'da tutulması, MongoDB replica set/sharding.

---

## 📁 Backend Klasör Yapısı

```
backend/src/
  config/            env (doğrulanmış), logger, database
  common/
    errors/          ApiError
    http/            response, catchAsync, pagination (offset + cursor)
    middlewares/     auth, deviceAuth, authorize, validate, rateLimiters,
                     upload, errorHandler, notFound
    security/        tokens (JWT/hash), sanitize (xss)
    crud/            farm-scope'lu generic CRUD factory
    validation/      ortak şemalar (ObjectId, GeoJSON)
    constants.js     roller, enum'lar, socket olay adları
  modules/
    auth/ user/ farm/ animal/ device/ zone/ camera/ field/
    telemetry/       model (time-series), ingestion, positioning, motion
    alert/           model, service (dedupe), controller
    dashboard/       özet metrikler
  realtime/          Socket.IO (JWT'li, çiftlik odaları)
  mqtt/              MQTT ingestion aboneliği
  routes/            ana router
  scripts/           seed, simulateDevice
  app.js server.js
```

Her modül **model → service → controller → route** katmanlarına ayrılmıştır.

---

## ✅ Test Edilenler

Bu kurulum uçtan uca doğrulanmıştır: giriş/JWT, cihaz telemetri kabulü, RSSI→bölge konumlandırma, anormal ivmede kritik alarm + kamera tetikleme, düşük pil alarmı (dedupe ile), bölge değişimi olayı, dashboard özetleri, cursor sayfalandırma ve güvenlik kontrolleri (geçersiz cihaz anahtarı → 401, NoSQL injection → 400). Python servisinde konumlandırma/hareket/verim uçları da doğrulanmıştır.

## 🔭 Sonraki Adımlar
Frontend (React/Next.js) paneli, kamera WebRTC/HLS medya köprüsü, MongoDB rollup (özet) job'ları, cihaz OTA firmware güncelleme, ve konumlandırma için parmak-izi/ML modeli.
