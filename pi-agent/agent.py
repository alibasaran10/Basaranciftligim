#!/usr/bin/env python3
"""
Akilli Ciftlik - Saha Kamera Ajani (Raspberry Pi)

Kameradan kare yakalar ve sunucuya canli olarak iletir.

NEDEN BAGLANTIYI PI BASLATIR:
Pi sahadadir; ev/tarla routerinin arkasinda, cogu zaman CGNAT altindadir ve
disaridan erisilemez. Bu yuzden sunucu Pi'ye baglanmaz --- Pi sunucuya
baglanir. Pi'nin internete cikabilmesi yeterlidir: port yonlendirme, sabit IP
veya VPN gerekmez. Kamera boylece KONUM FARKETMEKSIZIN calisir; Pi'yi baska
bir tarlaya, baska bir aga tasidiginizda hicbir ayar degistirmeniz gerekmez.

Kullanim:
    python3 agent.py --url ws://192.168.5.18:4000/ingest/camera --key <ajan-anahtari>

Ajan anahtarini panelden alirsiniz (Kameralar -> ilgili kamera -> Ajan
Anahtari Uret). Anahtar yalnizca bir kez gosterilir.

Donanim yokken uctan uca test icin:
    python3 agent.py --url ... --key ... --force-source sentetik
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import signal
import sys
import time

from pi_model import clamp_capture, detect_profile
from sources import SourceError, create_source

AGENT_VERSION = "1.0.0"

log = logging.getLogger("pi-agent")


# ---------------------------------------------------------------------------
# Yeniden baglanma
# ---------------------------------------------------------------------------

# Sahada internet kesintisi olagandir. Ajan asla pes etmez; artan bekleme
# ile yeniden dener, boylece kesinti bitince kendiliginden geri gelir.
RECONNECT_MIN_SECONDS = 2
RECONNECT_MAX_SECONDS = 60


class ReconnectDelay:
    """Ussel artan, tavani olan yeniden deneme beklemesi."""

    def __init__(self) -> None:
        self._current = RECONNECT_MIN_SECONDS

    def reset(self) -> None:
        self._current = RECONNECT_MIN_SECONDS

    def next(self) -> float:
        value = self._current
        self._current = min(self._current * 2, RECONNECT_MAX_SECONDS)
        return value


# ---------------------------------------------------------------------------
# Hareket algilama
# ---------------------------------------------------------------------------


class MotionDetector:
    """
    Cok hafif hareket algilama.

    Ard arda iki karenin JPEG BOYUTLARINI karsilastirir. Sahne degisince
    sikistirilmis boyut da belirgin sekilde degisir. Piksel bazli
    karsilastirmaya gore cok daha ucuzdur --- Pi Zero'da bile CPU yakmaz.
    Amaci kesin tespit degil, "bakmaya deger bir sey oldu" sinyali vermektir;
    kesin tespit Python analiz servisinin isidir.
    """

    def __init__(self, threshold_ratio: float = 0.18, cooldown_seconds: int = 30) -> None:
        self._threshold = threshold_ratio
        self._cooldown = cooldown_seconds
        self._previous_size: int | None = None
        self._last_event_at = 0.0

    def check(self, frame: bytes) -> bool:
        size = len(frame)
        previous = self._previous_size
        self._previous_size = size

        if previous is None or previous == 0:
            return False

        change = abs(size - previous) / previous
        if change < self._threshold:
            return False

        # Ayni hareket icin saniyede onlarca olay yazmayi engelle.
        now = time.monotonic()
        if now - self._last_event_at < self._cooldown:
            return False

        self._last_event_at = now
        return True


# ---------------------------------------------------------------------------
# Ajan
# ---------------------------------------------------------------------------


class CameraAgent:
    def __init__(self, args: argparse.Namespace) -> None:
        self.url = args.url
        self.key = args.key
        self.force_source = args.force_source
        self.detect_motion = not args.no_motion
        self.verify_tls = not args.insecure

        self.profile, self.raw_model = detect_profile()
        self._stopping = asyncio.Event()

    # -- baglanti dongusu ---------------------------------------------------

    async def run(self) -> int:
        try:
            import websockets  # noqa: F401
        except ImportError:
            log.error(
                "websockets kutuphanesi kurulu degil. Kurulum:\n"
                "  pip install websockets\n"
                "veya Raspberry Pi OS'ta:\n"
                "  sudo apt install -y python3-websockets"
            )
            return 1

        log.info("Kart: %s (%s)", self.profile.label, self.raw_model)
        log.info(
            "Tavan: %sx%s @ %sfps -- %s",
            self.profile.max_width,
            self.profile.max_height,
            self.profile.max_fps,
            self.profile.notes,
        )
        log.info("Sunucu: %s", self.url)

        delay = ReconnectDelay()

        while not self._stopping.is_set():
            try:
                await self._session()
                delay.reset()
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001 - dongu asla olmemeli
                log.warning("Baglanti sorunu: %s", exc)

            if self._stopping.is_set():
                break

            wait = delay.next()
            log.info("%s saniye sonra yeniden denenecek...", wait)
            try:
                await asyncio.wait_for(self._stopping.wait(), timeout=wait)
            except asyncio.TimeoutError:
                pass

        log.info("Ajan durduruldu.")
        return 0

    async def _session(self) -> None:
        import websockets

        headers = {"x-camera-key": self.key}

        # websockets 12+ 'additional_headers', daha eskisi 'extra_headers' bekler.
        connect_kwargs = {
            "max_size": 4 * 1024 * 1024,
            "ping_interval": 20,
            "ping_timeout": 20,
        }
        if not self.verify_tls and self.url.startswith("wss://"):
            import ssl

            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            connect_kwargs["ssl"] = context

        try:
            connection = websockets.connect(
                self.url, additional_headers=headers, **connect_kwargs
            )
        except TypeError:
            connection = websockets.connect(self.url, extra_headers=headers, **connect_kwargs)

        async with connection as ws:
            log.info("Sunucuya baglanildi, ayarlar bekleniyor...")

            await ws.send(
                json.dumps(
                    {
                        "type": "hello",
                        "model": self.profile.label,
                        "rawModel": self.raw_model,
                        "version": AGENT_VERSION,
                        "hardwareH264": self.profile.hardware_h264,
                    }
                )
            )

            # Sunucu ilk mesajda yakalama ayarlarini gonderir.
            raw = await asyncio.wait_for(ws.recv(), timeout=15)
            config = json.loads(raw)
            if config.get("type") != "ready":
                raise RuntimeError(f"Beklenmeyen ilk mesaj: {config!r}")

            await self._stream(ws, config)

    # -- kare akisi ---------------------------------------------------------

    async def _stream(self, ws, config: dict) -> None:
        source_type = self.force_source or config.get("source") or "usb"

        width, height, fps = clamp_capture(
            self.profile,
            config.get("width", 1280),
            config.get("height", 720),
            config.get("fps", 12),
        )

        if (width, height, fps) != (
            config.get("width"),
            config.get("height"),
            config.get("fps"),
        ):
            log.info(
                "Sunucu %sx%s@%sfps istedi; bu kart icin %sx%s@%sfps uygulaniyor.",
                config.get("width"),
                config.get("height"),
                config.get("fps"),
                width,
                height,
                fps,
            )

        log.info(
            "Kamera: %s  ·  kaynak=%s  ·  %sx%s @ %sfps",
            config.get("cameraName", "?"),
            source_type,
            width,
            height,
            fps,
        )

        source = create_source(
            source_type,
            width=width,
            height=height,
            fps=fps,
            quality=int(config.get("jpegQuality", 70)),
            source_index=int(config.get("sourceIndex", 0)),
            rtsp_url=config.get("rtspPath"),
            label=config.get("cameraName", "TEST"),
        )

        motion = MotionDetector() if self.detect_motion else None
        frame_interval = 1.0 / fps
        frames_sent = 0
        last_report = time.monotonic()

        with source:
            log.info("Yayin basladi.")
            next_frame_at = time.monotonic()

            while not self._stopping.is_set():
                # Kareyi ayri bir is parcaciginda oku: yakalama bloke eden bir
                # islemdir, asyncio dongusunu kilitlememeli (aksi halde ping
                # yanitlari gecikir ve sunucu baglantiyi dusurur).
                frame = await asyncio.to_thread(source.read_jpeg)

                await ws.send(frame)
                frames_sent += 1

                if motion is not None and motion.check(frame):
                    await ws.send(json.dumps({"type": "event", "event": "hareket_algilandi"}))
                    log.info("Hareket algilandi, olay bildirildi.")

                now = time.monotonic()
                if now - last_report >= 60:
                    log.info(
                        "%s kare gonderildi (son 60sn: ~%.1f fps)",
                        frames_sent,
                        frames_sent / (now - last_report),
                    )
                    frames_sent = 0
                    last_report = now

                # Sabit kare araligi: kaydigi zaman telafi et, birikmisse atla.
                next_frame_at += frame_interval
                sleep_for = next_frame_at - time.monotonic()
                if sleep_for > 0:
                    await asyncio.sleep(sleep_for)
                else:
                    next_frame_at = time.monotonic()

    def stop(self) -> None:
        self._stopping.set()


# ---------------------------------------------------------------------------


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Akilli Ciftlik saha kamera ajani",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("SURUM_INGEST_URL", ""),
        help="Sunucu kabul adresi, orn: ws://192.168.5.18:4000/ingest/camera "
        "(ortam degiskeni: SURUM_INGEST_URL)",
    )
    parser.add_argument(
        "--key",
        default=os.environ.get("SURUM_CAMERA_KEY", ""),
        help="Panelden alinan ajan anahtari (ortam degiskeni: SURUM_CAMERA_KEY)",
    )
    parser.add_argument(
        "--force-source",
        choices=["usb", "csi", "rtsp", "sentetik"],
        default=os.environ.get("SURUM_SOURCE") or None,
        help="Sunucudaki kaynak ayarini gecersiz kil (test icin kullanislidir)",
    )
    parser.add_argument(
        "--no-motion",
        action="store_true",
        help="Hareket algilamayi kapat",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="wss:// icin sertifika dogrulamasini atla (yalnizca kendi imzali "
        "sertifika ile test ederken)",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Ayrintili log")

    args = parser.parse_args(argv)

    if not args.url:
        parser.error("--url zorunlu (veya SURUM_INGEST_URL ortam degiskeni)")
    if not args.key:
        parser.error("--key zorunlu (veya SURUM_CAMERA_KEY ortam degiskeni)")

    return args


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s  %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )

    agent = CameraAgent(args)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # systemd `systemctl stop` ile SIGTERM gonderir; yayini duzgun kapatalim.
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, agent.stop)
        except NotImplementedError:  # pragma: no cover - Windows
            pass

    try:
        return loop.run_until_complete(agent.run())
    except SourceError as exc:
        log.error("Kamera kaynagi hatasi:\n%s", exc)
        return 2
    except KeyboardInterrupt:
        return 0
    finally:
        loop.close()


if __name__ == "__main__":
    sys.exit(main())
