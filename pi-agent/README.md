# Saha Kamera Ajanı (Raspberry Pi)

Kameradan görüntü alır ve sunucuya canlı olarak iletir. Web ve mobil
uygulamalar görüntüyü sunucudan izler.

## Neden bağlantıyı Pi başlatır

Pi sahadadır: ev/tarla router'ının arkasında, çoğu zaman CGNAT altında ve
dışarıdan erişilemez. Bu yüzden sunucu Pi'ye bağlanmaz — **Pi sunucuya
bağlanır**. Pi'nin internete çıkabilmesi yeterlidir:

- port yönlendirme **gerekmez**
- sabit IP **gerekmez**
- VPN **gerekmez**

Pi'yi başka bir tarlaya, başka bir ağa, başka bir şehre taşıyabilirsiniz;
hiçbir ayar değiştirmeniz gerekmez. Kamera **konum farketmeksizin** çalışır.

```
   Pi (sahada)                    Sunucu                    İzleyiciler
  ┌───────────┐   dışarı doğru   ┌────────┐   MJPEG        ┌─────────┐
  │ kamera →  │ ═══ WebSocket ══▶│ kare   │ ═════════════▶ │ web     │
  │ agent.py  │   (JPEG kare)    │ deposu │                │ mobil   │
  └───────────┘                  └────────┘                └─────────┘
```

## Desteklenen kartlar

Ajan kartı kendisi tanır (`/proc/device-tree/model`) ve panelden gelen
ayarları o kartın kaldırabileceği tavanla kesiştirir. Panelden 1080p/25fps
istense bile Pi Zero kendini kilitlemez; kaldırabildiği en iyi ayarda çalışır.

| Kart | Tavan | Donanım H.264 | Not |
|---|---|---|---|
| Raspberry Pi 5 | 1920×1080 @ 25fps | yok (kaldırıldı) | CPU yazılım kodlamaya fazlasıyla yeter |
| Raspberry Pi 4 / 400 | 1920×1080 @ 25fps | var | En verimli seçenek |
| Raspberry Pi 3 | 1280×720 @ 15fps | var | 1080p'de kare düşürür |
| Raspberry Pi 2 | 1280×720 @ 10fps | var | Eski kart, zorlanmamalı |
| Raspberry Pi Zero 2 W | 640×480 @ 10fps | var | Düşük güç |
| Raspberry Pi Zero | 640×480 @ 5fps | var | Tek çekirdek |

Pi dışı bir makinede (geliştirici dizüstü) donanım sınırı uygulanmaz.

## Desteklenen kamera tipleri

| Kaynak | Donanım | Gereken paket |
|---|---|---|
| `usb` | USB webcam (`/dev/video0`) | `python3-opencv` |
| `csi` | Şerit kablolu Pi Camera Module | `python3-picamera2` |
| `rtsp` | IP kamera (Pi yalnızca köprü) | `python3-opencv` |
| `sentetik` | Donanım gerekmez | `Pillow` |

`sentetik` kaynak demo için değil **doğrulama** içindir: kamera daha elinize
geçmeden Pi → sunucu → web/mobil zincirinin tamamının çalıştığını kanıtlar.
Üretilen karede saat ve artan sayaç olduğu için görüntünün gerçekten *aktığı*
(donmuş bir resim olmadığı) gözle görülür.

## Kurulum

### 1. Ajan anahtarını alın

Panelde **Kameralar → ilgili kamera → Ajan Anahtarı Üret**. Anahtar
**yalnızca bir kez** gösterilir; kaybederseniz yenisini üretirsiniz (eski
anahtar o anda geçersiz olur).

Komut satırından da alınabilir:

```bash
curl -X POST -H "Authorization: Bearer <access-token>" \
  http://<sunucu>:4000/api/v1/cameras/<kamera-id>/stream-key
```

### 2. Pi'ye dosyaları kopyalayın

```bash
sudo mkdir -p /opt/surum-camera
sudo cp agent.py sources.py pi_model.py /opt/surum-camera/
```

### 3. Bağımlılıkları kurun

```bash
sudo apt update
sudo apt install -y python3-websockets

# USB webcam veya RTSP için:
sudo apt install -y python3-opencv

# CSI şerit kablolu Pi Camera Module için:
sudo apt install -y python3-picamera2

# Sentetik test kaynağı için:
sudo apt install -y python3-pil
```

`python3-websockets` paketi eski Pi OS sürümlerinde bulunmayabilir; o
durumda:

```bash
pip3 install websockets
```

### 4. Ayarları yazın

```bash
sudo tee /etc/surum-camera.env > /dev/null <<'EOF'
SURUM_INGEST_URL=ws://192.168.5.18:4000/ingest/camera
SURUM_CAMERA_KEY=buraya-panelden-aldiginiz-anahtar
EOF

sudo chmod 600 /etc/surum-camera.env
```

Anahtar bu dosyada düz metin durur; `chmod 600` **atlanmamalıdır**.

### 5. Elle deneyin

Servise almadan önce çalıştığını görün:

```bash
python3 /opt/surum-camera/agent.py \
  --url ws://192.168.5.18:4000/ingest/camera \
  --key <anahtar> \
  --verbose
```

Kamera henüz bağlı değilse zinciri yine de doğrulayabilirsiniz:

```bash
python3 /opt/surum-camera/agent.py --url ... --key ... --force-source sentetik
```

### 6. Servise alın

```bash
sudo useradd -r -G video -s /usr/sbin/nologin surum   # yoksa
sudo cp surum-camera.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now surum-camera
```

Durum ve günlükler:

```bash
systemctl status surum-camera
journalctl -u surum-camera -f
```

## Ayarlar

Yakalama ayarları **panelden** yönetilir (çözünürlük, fps, JPEG kalitesi,
kaynak tipi). Ajan her bağlandığında sunucudan alır; Pi'ye dokunmanız
gerekmez.

Komut satırı seçenekleri:

| Seçenek | Açıklama |
|---|---|
| `--url` | Sunucu kabul adresi (`SURUM_INGEST_URL`) |
| `--key` | Ajan anahtarı (`SURUM_CAMERA_KEY`) |
| `--force-source` | Sunucudaki kaynak ayarını geçersiz kıl (`usb`/`csi`/`rtsp`/`sentetik`) |
| `--no-motion` | Hareket algılamayı kapat |
| `--insecure` | `wss://` için sertifika doğrulamasını atla (yalnızca kendi imzalı sertifika ile test ederken) |
| `--verbose` | Ayrıntılı günlük |

## Sorun giderme

**"Kamera açılamadı" / `/dev/video0` yok**

```bash
ls /dev/video*                    # cihaz görünüyor mu
sudo usermod -aG video $USER      # izin (sonra yeniden oturum açın)
v4l2-ctl --list-devices           # hangi cihaz hangi kamera
```

**"Geçersiz kamera anahtarı" (sunucu bağlantıyı kapatıyor)**

Anahtar yanlış ya da panelden yeniden üretilmiş. Yeni anahtar üretip
`/etc/surum-camera.env` içine yazın, sonra `sudo systemctl restart surum-camera`.

**Ajan bağlanıyor ama panelde görüntü yok**

Kamera pasif olabilir (`isActive: false`) veya farklı bir çiftliğe ait
hesapla bakıyorsunuzdur. Sunucu günlüğünde `[ingest] ajan baglandi` satırını
arayın.

**Görüntü takılıyor / gecikiyor**

Kartın tavanını aşıyorsunuz demektir. Panelden çözünürlüğü veya fps'i
düşürün; ajan zaten kendi tavanını uygular ama ağ da darboğaz olabilir.
MJPEG bant genişliği yüksektir: 720p/12fps kabaca 3–4 Mbit/s ister.

**Mobil veride bant genişliği yetmiyor**

Panelden 640×480 / 6fps'e düşürün — kabaca 0.8 Mbit/s'e iner.
