"""
Goruntu kaynaklari.

Her kaynak ayni sozlesmeyi uygular: `open()`, `read_jpeg()`, `close()`.
Boylece ajanin geri kalani USB webcam ile Pi Camera Module arasindaki
farki hic bilmez.

Bagimliliklar KAYNAGA GORE opsiyoneldir; yalnizca kullanilan kaynagin
kutuphanesi kurulu olmalidir. Bir kaynak kullanilamiyorsa ne yapilmasi
gerektigini anlatan net bir hata verir --- sessizce siyah kare uretmez.
"""

from __future__ import annotations

import io
import math
import time
from abc import ABC, abstractmethod


class SourceError(RuntimeError):
    """Kaynak acilamadi veya kare okunamadi."""


class FrameSource(ABC):
    """Tum goruntu kaynaklarinin ortak arayuzu."""

    def __init__(self, width: int, height: int, fps: int, quality: int) -> None:
        self.width = width
        self.height = height
        self.fps = fps
        self.quality = quality

    @abstractmethod
    def open(self) -> None: ...

    @abstractmethod
    def read_jpeg(self) -> bytes:
        """Tek bir kareyi JPEG bayt dizisi olarak dondurur."""

    @abstractmethod
    def close(self) -> None: ...

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, *_exc):
        self.close()


# ---------------------------------------------------------------------------
# USB webcam ve RTSP: ikisi de OpenCV'nin VideoCapture'i uzerinden okunur
# ---------------------------------------------------------------------------


class OpenCVSource(FrameSource):
    """
    V4L2 (USB webcam) veya RTSP akisi.

    OpenCV her iki durumda da ayni API'yi verir; degisen yalnizca
    VideoCapture'a verilen hedeftir.
    """

    def __init__(self, target, *, is_rtsp: bool, **kwargs) -> None:
        super().__init__(**kwargs)
        self._target = target
        self._is_rtsp = is_rtsp
        self._cap = None
        self._cv2 = None

    def open(self) -> None:
        try:
            import cv2
        except ImportError as exc:
            raise SourceError(
                "OpenCV kurulu degil. Kurulum:\n"
                "  sudo apt install -y python3-opencv\n"
                "veya:\n"
                "  pip install opencv-python-headless"
            ) from exc

        self._cv2 = cv2
        self._cap = cv2.VideoCapture(self._target)

        if not self._cap.isOpened():
            hint = (
                "RTSP adresi yanlis veya kamera erisilemiyor."
                if self._is_rtsp
                else f"/dev/video{self._target} acilamadi. "
                "Baglanti icin: `ls /dev/video*` ile cihazi dogrulayin, "
                "kullaniciyi 'video' grubuna ekleyin: "
                "`sudo usermod -aG video $USER` (sonra yeniden oturum acin)."
            )
            raise SourceError(f"Kamera acilamadi. {hint}")

        if not self._is_rtsp:
            # USB kamerada cozunurluk/fps istegi; surucu en yakinini secer.
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self._cap.set(cv2.CAP_PROP_FPS, self.fps)

        # Tampon 1'e cekilir: aksi halde okunan kare saniyeler once
        # yakalanmis olur ve "canli" goruntu gecikmeli gorunur.
        try:
            self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:  # noqa: BLE001 - her surucu desteklemez, kritik degil
            pass

    def read_jpeg(self) -> bytes:
        if self._cap is None:
            raise SourceError("Kaynak acilmadan okunmaya calisildi")

        ok, frame = self._cap.read()
        if not ok or frame is None:
            raise SourceError("Kameradan kare okunamadi (baglanti kopmus olabilir)")

        # RTSP'de kaynak cozunurlugu bizim istedigimizden buyuk olabilir.
        height, width = frame.shape[:2]
        if width != self.width or height != self.height:
            frame = self._cv2.resize(
                frame, (self.width, self.height), interpolation=self._cv2.INTER_AREA
            )

        ok, buffer = self._cv2.imencode(
            ".jpg", frame, [int(self._cv2.IMWRITE_JPEG_QUALITY), self.quality]
        )
        if not ok:
            raise SourceError("Kare JPEG'e cevrilemedi")
        return buffer.tobytes()

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None


# ---------------------------------------------------------------------------
# CSI serit kablo: Pi Camera Module (picamera2)
# ---------------------------------------------------------------------------


class CSISource(FrameSource):
    """
    Pi Camera Module (serit kablo ile CSI portuna baglanir).

    picamera2 Raspberry Pi OS'ta hazir gelir; pip ile kurulmasi onerilmez
    (libcamera sistem kutuphanelerine baglidir).
    """

    def __init__(self, camera_num: int = 0, **kwargs) -> None:
        super().__init__(**kwargs)
        self._camera_num = camera_num
        self._picam = None

    def open(self) -> None:
        try:
            from picamera2 import Picamera2
        except ImportError as exc:
            raise SourceError(
                "picamera2 bulunamadi. Raspberry Pi OS'ta kurulum:\n"
                "  sudo apt install -y python3-picamera2\n"
                "Serit kablonun CSI portuna dogru yonde takili oldugunu da dogrulayin."
            ) from exc

        self._picam = Picamera2(camera_num=self._camera_num)
        config = self._picam.create_video_configuration(
            main={"size": (self.width, self.height), "format": "RGB888"}
        )
        self._picam.configure(config)
        self._picam.start()
        # Otomatik pozlama/beyaz dengesi otursun; ilk kareler karanlik gelir.
        time.sleep(1.5)

    def read_jpeg(self) -> bytes:
        if self._picam is None:
            raise SourceError("Kaynak acilmadan okunmaya calisildi")

        array = self._picam.capture_array()

        try:
            import cv2

            ok, buffer = cv2.imencode(
                ".jpg", array[:, :, ::-1], [int(cv2.IMWRITE_JPEG_QUALITY), self.quality]
            )
            if not ok:
                raise SourceError("Kare JPEG'e cevrilemedi")
            return buffer.tobytes()
        except ImportError:
            # OpenCV yoksa Pillow ile kodla (Pi OS'ta genelde kurulu).
            try:
                from PIL import Image
            except ImportError as exc:
                raise SourceError(
                    "JPEG kodlamak icin OpenCV veya Pillow gerekli:\n"
                    "  sudo apt install -y python3-opencv\n"
                    "veya  pip install Pillow"
                ) from exc

            image = Image.fromarray(array)
            out = io.BytesIO()
            image.save(out, format="JPEG", quality=self.quality)
            return out.getvalue()

    def close(self) -> None:
        if self._picam is not None:
            self._picam.stop()
            self._picam.close()
            self._picam = None


# ---------------------------------------------------------------------------
# Sentetik: donanim olmadan uctan uca test
# ---------------------------------------------------------------------------


class SyntheticSource(FrameSource):
    """
    Kamera olmadan hareketli test karesi uretir.

    Amaci demo degil DOGRULAMA: kamera daha eline gecmeden Pi -> sunucu ->
    web/mobil zincirinin tamaminin calistigi kanitlanabilir. Kare uzerinde
    saat ve artan sayac oldugu icin goruntunun gercekten AKTIGI (donmus bir
    resim olmadigi) gozle dogrulanabilir.
    """

    def __init__(self, label: str = "TEST", **kwargs) -> None:
        super().__init__(**kwargs)
        self._label = label
        self._frame_index = 0
        self._image_mod = None
        self._draw_mod = None

    def open(self) -> None:
        try:
            from PIL import Image, ImageDraw
        except ImportError as exc:
            raise SourceError(
                "Sentetik kaynak Pillow gerektirir:\n  pip install Pillow"
            ) from exc
        self._image_mod = Image
        self._draw_mod = ImageDraw

    def read_jpeg(self) -> bytes:
        if self._image_mod is None:
            raise SourceError("Kaynak acilmadan okunmaya calisildi")

        self._frame_index += 1
        phase = self._frame_index / max(self.fps, 1)

        image = self._image_mod.new("RGB", (self.width, self.height), (18, 32, 24))
        draw = self._draw_mod.Draw(image)

        # Yatay bir gradyan bant: kare gercekten degisiyor mu, gozle belli olsun.
        band_height = max(2, self.height // 24)
        for row in range(0, self.height, band_height):
            shade = int(40 + 30 * math.sin((row / self.height * 6) + phase))
            draw.rectangle(
                [(0, row), (self.width, row + band_height)],
                fill=(shade // 3, shade, shade // 2),
            )

        # Saat yonunde donen isaretci: donmus goruntuyu aninda ele verir.
        cx, cy = self.width // 2, self.height // 2
        radius = min(self.width, self.height) // 4
        angle = phase * 1.6
        draw.ellipse(
            [(cx - radius, cy - radius), (cx + radius, cy + radius)],
            outline=(120, 220, 160),
            width=max(2, self.width // 200),
        )
        draw.line(
            [(cx, cy), (cx + radius * math.cos(angle), cy + radius * math.sin(angle))],
            fill=(220, 255, 230),
            width=max(2, self.width // 220),
        )

        stamp = time.strftime("%H:%M:%S")
        draw.text((12, 12), f"{self._label}  ·  {stamp}", fill=(235, 245, 240))
        draw.text((12, 30), f"kare #{self._frame_index}", fill=(160, 200, 180))
        draw.text(
            (12, self.height - 24),
            f"{self.width}x{self.height} @ {self.fps}fps  (sentetik test kaynagi)",
            fill=(130, 170, 150),
        )

        out = io.BytesIO()
        image.save(out, format="JPEG", quality=self.quality)
        return out.getvalue()

    def close(self) -> None:
        self._image_mod = None
        self._draw_mod = None


# ---------------------------------------------------------------------------


def create_source(
    source_type: str,
    *,
    width: int,
    height: int,
    fps: int,
    quality: int,
    source_index: int = 0,
    rtsp_url: str | None = None,
    label: str = "TEST",
) -> FrameSource:
    """Sunucunun bildirdigi kaynak tipine gore dogru siniti kurar."""
    common = {"width": width, "height": height, "fps": fps, "quality": quality}
    kind = (source_type or "usb").strip().lower()

    if kind == "usb":
        return OpenCVSource(source_index, is_rtsp=False, **common)

    if kind == "csi":
        return CSISource(camera_num=source_index, **common)

    if kind == "rtsp":
        if not rtsp_url:
            raise SourceError(
                "Kaynak 'rtsp' secili ama kameranin rtspPath alani bos. "
                "Paneldeki kamera ayarlarindan RTSP yolunu girin."
            )
        return OpenCVSource(rtsp_url, is_rtsp=True, **common)

    if kind in ("sentetik", "synthetic", "test"):
        return SyntheticSource(label=label, **common)

    raise SourceError(f"Bilinmeyen kaynak tipi: {source_type!r}")
