"""
Raspberry Pi model tespiti ve modele gore yakalama sinirlari.

Ayni ajan kodu Pi Zero 2 W'den Pi 5'e kadar her kartta calisir; fark
yalnizca ne kadar yuk kaldirabildikleridir. Sunucudan gelen ayarlar
buradaki tavan degerleriyle kesistirilir --- boylece panelden 1080p/25fps
istense bile Pi Zero kendini kilitlemez, kaldirabildigi en iyi ayarda
calismaya devam eder.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ModelProfile:
    """Bir Pi modelinin guvenli calisma tavani."""

    key: str
    label: str
    max_width: int
    max_height: int
    max_fps: int
    # Donanim H.264 kodlayicisi var mi (MJPEG'de kullanmiyoruz ama
    # ileride kayit/arsiv eklenirse bu bilgi belirleyici olacak).
    hardware_h264: bool
    notes: str


# Bilinen kartlar. Anahtar, /proc/device-tree/model ciktisinda aranir.
PROFILES: tuple[ModelProfile, ...] = (
    ModelProfile(
        key="pi5",
        label="Raspberry Pi 5",
        max_width=1920,
        max_height=1080,
        max_fps=25,
        hardware_h264=False,  # Pi 5'te donanim H.264 kodlayici kaldirildi
        notes="CPU yazilim kodlamaya fazlasiyla yeter; 1080p rahat.",
    ),
    ModelProfile(
        key="pi4",
        label="Raspberry Pi 4",
        max_width=1920,
        max_height=1080,
        max_fps=25,
        hardware_h264=True,
        notes="Donanim kodlayici var; en verimli secenek.",
    ),
    ModelProfile(
        key="pi400",
        label="Raspberry Pi 400",
        max_width=1920,
        max_height=1080,
        max_fps=25,
        hardware_h264=True,
        notes="Pi 4 ile ayni SoC.",
    ),
    ModelProfile(
        key="pi3",
        label="Raspberry Pi 3",
        max_width=1280,
        max_height=720,
        max_fps=15,
        hardware_h264=True,
        notes="720p makul; 1080p'de kare dusurur.",
    ),
    ModelProfile(
        key="pizero2",
        label="Raspberry Pi Zero 2 W",
        max_width=640,
        max_height=480,
        max_fps=10,
        hardware_h264=True,
        notes="Dusuk guc; 640x480/10fps gercekci sinir.",
    ),
    ModelProfile(
        key="pizero",
        label="Raspberry Pi Zero",
        max_width=640,
        max_height=480,
        max_fps=5,
        hardware_h264=True,
        notes="Tek cekirdek; yalnizca dusuk kare hizi.",
    ),
    ModelProfile(
        key="pi2",
        label="Raspberry Pi 2",
        max_width=1280,
        max_height=720,
        max_fps=10,
        hardware_h264=True,
        notes="Eski karti zorlamamak icin 720p/10fps.",
    ),
)

# Pi disinda bir makinede (gelistirici dizustu) calisirken kullanilir.
GENERIC_PROFILE = ModelProfile(
    key="generic",
    label="Raspberry Pi disi makine",
    max_width=1920,
    max_height=1080,
    max_fps=30,
    hardware_h264=False,
    notes="Gelistirme/test makinesi; donanim siniri uygulanmaz.",
)


def read_model_string() -> str:
    """
    Kartin kendi bildirdigi model adi.
    Pi'de /proc/device-tree/model sonu NUL bayti ile biter, temizlenir.
    """
    for path in ("/proc/device-tree/model", "/sys/firmware/devicetree/base/model"):
        try:
            raw = Path(path).read_bytes()
        except (OSError, FileNotFoundError):
            continue
        text = raw.decode("utf-8", errors="ignore").replace("\x00", "").strip()
        if text:
            return text

    # Bazi kurulumlarda model yalnizca cpuinfo'da bulunur.
    try:
        cpuinfo = Path("/proc/cpuinfo").read_text(encoding="utf-8", errors="ignore")
    except (OSError, FileNotFoundError):
        return ""
    match = re.search(r"^Model\s*:\s*(.+)$", cpuinfo, re.MULTILINE)
    return match.group(1).strip() if match else ""


def detect_profile(model_string: str | None = None) -> tuple[ModelProfile, str]:
    """
    Model metnini profile eslestirir.

    Returns:
        (profil, ham_model_metni)
    """
    raw = model_string if model_string is not None else read_model_string()
    normalized = re.sub(r"[^a-z0-9]", "", raw.lower())

    if not normalized or "raspberrypi" not in normalized:
        return GENERIC_PROFILE, raw or "bilinmeyen"

    # Sira onemli: "pizero2" kontrolu "pizero"dan once gelmeli, aksi halde
    # Zero 2 W yanlislikla tek cekirdekli Zero profiline duserdi.
    if "zero2" in normalized:
        return _by_key("pizero2"), raw
    if "zero" in normalized:
        return _by_key("pizero"), raw
    if "raspberrypi5" in normalized:
        return _by_key("pi5"), raw
    if "raspberrypi400" in normalized:
        return _by_key("pi400"), raw
    if "raspberrypi4" in normalized:
        return _by_key("pi4"), raw
    if "raspberrypi3" in normalized:
        return _by_key("pi3"), raw
    if "raspberrypi2" in normalized:
        return _by_key("pi2"), raw

    # Taninmayan ama Pi oldugu kesin bir kart: en muhafazakar profil.
    return _by_key("pi3"), raw


def _by_key(key: str) -> ModelProfile:
    for profile in PROFILES:
        if profile.key == key:
            return profile
    return GENERIC_PROFILE


def clamp_capture(profile: ModelProfile, width: int, height: int, fps: int) -> tuple[int, int, int]:
    """
    Sunucudan gelen ayarlari kartin tavaniyla kesistirir.
    En-boy oranini korur: yalnizca genislik kirpilirsa goruntu bozulurdu.
    """
    safe_fps = max(1, min(int(fps), profile.max_fps))

    safe_width = max(160, int(width))
    safe_height = max(120, int(height))

    if safe_width > profile.max_width or safe_height > profile.max_height:
        scale = min(profile.max_width / safe_width, profile.max_height / safe_height)
        safe_width = max(160, int(safe_width * scale) // 2 * 2)
        safe_height = max(120, int(safe_height * scale) // 2 * 2)

    return safe_width, safe_height, safe_fps
