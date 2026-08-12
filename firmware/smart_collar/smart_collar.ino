/*
 * ===========================================================================
 *  Akilli Tasma - ESP32 Firmware (Referans)
 * ===========================================================================
 *  Gorevi:
 *   1) MPU6050 ivmeolcerden x/y/z okur, hareket durumunu (magnitude) hesaplar.
 *   2) Ortamdaki Wi-Fi AP'lerini tarar; BSSID (MAC) + RSSI toplar.
 *   3) Pil seviyesini olcer (ADC uzerinden pil gerilimi).
 *   4) Tumunu JSON yapip backend'e HTTP POST ile gonderir:
 *        POST /api/v1/telemetry/ingest
 *        Header: x-device-key: <CIHAZ_API_ANAHTARI>
 *   5) Gonderim sonrasi ~15 dk DERIN UYKU (deep sleep) ile guc tasarrufu.
 *
 *  Backend ingestion sozlesmesi (body):
 *   {
 *     "mac": "aa:bb:cc:dd:ee:01",
 *     "ts": "2026-07-24T10:00:00Z",           // opsiyonel
 *     "accel": { "x":.., "y":.., "z":.., "magnitude":.. },
 *     "battery": 72,                            // 0..100
 *     "rssiScans": [ { "bssid":"..", "rssi":-55 }, ... ]
 *   }
 *
 *  Gerekli kutuphaneler (Arduino Library Manager):
 *   - Adafruit MPU6050, Adafruit Unified Sensor
 *   - ArduinoJson (v6+)
 *  (WiFi, HTTPClient ESP32 core ile gelir.)
 *
 *  GUVENLIK NOTLARI:
 *   - CIHAZ_API_ANAHTARI'ni kaynak koda gomup halka acik repoya KOYMAYIN;
 *     uretimde NVS/secure element kullanin. Backend her cihaza ayri anahtar verir
 *     (POST /devices/:id/rotate-key ciktisi).
 *   - Uretimde HTTPS (WiFiClientSecure + sunucu sertifikasi dogrulamasi) kullanin.
 * ===========================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ----------------------------- YAPILANDIRMA --------------------------------
static const char* WIFI_SSID     = "CIFTLIK_WIFI";
static const char* WIFI_PASSWORD = "wifi_parolasi";

// Backend ingestion adresi (uretimde https://... kullanin).
static const char* INGEST_URL    = "http://192.168.1.10:4000/api/v1/telemetry/ingest";
// Bu cihaza atanmis API anahtari (backend uretir).
static const char* DEVICE_API_KEY = "CIHAZ_API_ANAHTARINI_BURAYA_YAZIN";

static const uint64_t SLEEP_MINUTES = 15;          // uyku periyodu
static const uint32_t WIFI_TIMEOUT_MS = 15000;     // wifi baglanma zaman asimi
static const int      MAX_RSSI_SCANS = 12;         // gonderilecek maks AP sayisi
static const int      BATTERY_ADC_PIN = 34;        // pil olcum ADC pini
// ---------------------------------------------------------------------------

Adafruit_MPU6050 mpu;

// MAC adresini "aa:bb:cc:dd:ee:ff" bicimine getirir.
String getMacAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char buf[18];
  snprintf(buf, sizeof(buf), "%02x:%02x:%02x:%02x:%02x:%02x",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

// Basit pil yuzdesi (3.3V-4.2V lipo varsayimi; devrenize gore kalibre edin).
int readBatteryPercent() {
  const float vref = 3.3f;
  const int   adcMax = 4095;
  // Gerilim bolucu varsa carpani (orn. 2.0) uygulayin.
  const float dividerRatio = 2.0f;
  int raw = analogRead(BATTERY_ADC_PIN);
  float voltage = (raw / (float)adcMax) * vref * dividerRatio;
  float pct = (voltage - 3.3f) / (4.2f - 3.3f) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return (int)pct;
}

bool connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_TIMEOUT_MS) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

void buildAndSend() {
  StaticJsonDocument<2048> doc;
  doc["mac"] = getMacAddress();

  // --- Ivme okuma ---
  JsonObject accel = doc.createNestedObject("accel");
  if (mpu.begin()) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    // m/s^2 -> yaklasik 'g' (9.81'e bol) [backend 'g' bekler].
    float x = a.acceleration.x / 9.81f;
    float y = a.acceleration.y / 9.81f;
    float z = a.acceleration.z / 9.81f;
    accel["x"] = x;
    accel["y"] = y;
    accel["z"] = z;
    accel["magnitude"] = sqrt(x * x + y * y + z * z);
  } else {
    Serial.println("MPU6050 bulunamadi!");
  }

  // --- Pil ---
  doc["battery"] = readBatteryPercent();

  // --- Wi-Fi tarama (RSSI) ---
  JsonArray scans = doc.createNestedArray("rssiScans");
  int n = WiFi.scanNetworks(false, true);  // async=false, show_hidden=true
  int count = 0;
  for (int i = 0; i < n && count < MAX_RSSI_SCANS; i++) {
    JsonObject s = scans.createNestedObject();
    s["bssid"] = WiFi.BSSIDstr(i);  // AP MAC
    s["rssi"] = WiFi.RSSI(i);
    count++;
  }
  WiFi.scanDelete();

  // --- Gonder ---
  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);
  int code = http.POST(body);
  Serial.printf("Ingest HTTP %d\n", code);
  if (code > 0) Serial.println(http.getString());
  http.end();
}

void goToDeepSleep() {
  uint64_t us = SLEEP_MINUTES * 60ULL * 1000000ULL;
  esp_sleep_enable_timer_wakeup(us);
  Serial.printf("Derin uykuya geciliyor (%llu dk)...\n", (unsigned long long)SLEEP_MINUTES);
  Serial.flush();
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin();

  if (connectWifi()) {
    Serial.println("Wi-Fi baglandi: " + WiFi.localIP().toString());
    buildAndSend();
  } else {
    Serial.println("Wi-Fi baglanamadi, bu tur atlaniyor.");
  }

  goToDeepSleep();  // uyandiginda setup() bastan calisir
}

void loop() {
  // Kullanilmiyor: cihaz setup + deep sleep dongusuyle calisir.
}
