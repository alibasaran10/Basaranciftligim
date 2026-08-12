"""Hareket siniflandirma.

Tek bir okuma yerine bir PENCERE (ardisik ivme ornekleri) uzerinden istatistik
cikarir: ortalama buyukluk ve degiskenlik (std). Boylece "yatiyor" (dusuk
buyukluk + dusuk degiskenlik) ile "kosuyor" (yuksek buyukluk + yuksek
degiskenlik) daha guvenilir ayrilir.
"""
from __future__ import annotations

import numpy as np

from ..schemas import MotionRequest, MotionResponse

# Durum sabitleri Node tarafiyla (constants.js MOTION_STATE) ayni degerlerde.
LYING = "yatiyor"
GRAZING = "otluyor"
ACTIVE = "aktif"
RUNNING = "kosuyor"
UNKNOWN = "bilinmiyor"


def classify_motion(req: MotionRequest) -> MotionResponse:
    arr = np.array([[s.x, s.y, s.z] for s in req.samples], dtype=float)
    magnitudes = np.linalg.norm(arr, axis=1)

    mean_mag = float(np.mean(magnitudes))
    std_mag = float(np.std(magnitudes))

    # Aktivite indeksi: buyukluk + degiskenligin birlesimi (basit, sezgisel).
    activity = mean_mag + 2.0 * std_mag

    if mean_mag < 0.85 and std_mag < 0.1:
        state = LYING
    elif activity < 1.2:
        state = GRAZING
    elif activity < 2.2:
        state = ACTIVE
    else:
        state = RUNNING

    return MotionResponse(
        state=state,
        mean_magnitude=round(mean_mag, 4),
        magnitude_std=round(std_mag, 4),
        activity_index=round(activity, 4),
    )
