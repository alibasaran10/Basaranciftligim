"""Gelismis RSSI konumlandirma.

Node backend hizli, basit bir "en guclu AP" secimi yapar. Bu servis daha
zengin bir skorlama sunar: her bolge icin gorulen AP'lerin RSSI'larini
dogrusal-olmayan bir agirlikla toplayip normalize eder ve bir guven
(confidence) skoru uretir. Ileride burada parmak izi (fingerprinting) veya
ML tabanli konumlandirma kolayca eklenebilir.
"""
from __future__ import annotations

import numpy as np

from ..schemas import PositioningRequest, PositioningResponse, ZoneScore


def _rssi_to_weight(rssi: int, min_rssi: int) -> float:
    """RSSI'yi (dBm) 0..1 araligina cevirir. Guclu sinyal -> yuksek agirlik."""
    if rssi < min_rssi:
        return 0.0
    # -30 dBm ~ cok yakin (1.0), min_rssi ~ 0.0
    span = max(1, (-30) - min_rssi)
    return float(np.clip((rssi - min_rssi) / span, 0.0, 1.0))


def resolve_position(req: PositioningRequest) -> PositioningResponse:
    # AP MAC -> bolge eslemesi.
    ap_to_zone: dict[str, tuple[str, str]] = {}
    for z in req.zones:
        for mac in z.router_macs:
            ap_to_zone[mac.lower()] = (z.zone_id, z.zone_name)

    agg: dict[str, dict] = {}
    for scan in req.scans:
        mac = scan.bssid.lower()
        if mac not in ap_to_zone:
            continue
        w = _rssi_to_weight(scan.rssi, req.min_rssi)
        if w <= 0:
            continue
        zid, zname = ap_to_zone[mac]
        cur = agg.setdefault(
            zid, {"zone_name": zname, "weight": 0.0, "best_rssi": -999, "matched": 0}
        )
        cur["weight"] += w
        cur["best_rssi"] = max(cur["best_rssi"], scan.rssi)
        cur["matched"] += 1

    if not agg:
        return PositioningResponse(zone_id=None, zone_name=None, confidence=0.0, ranking=[])

    total_weight = sum(v["weight"] for v in agg.values()) or 1.0
    ranking = [
        ZoneScore(
            zone_id=zid,
            zone_name=v["zone_name"],
            score=round(v["weight"] / total_weight, 4),
            best_rssi=int(v["best_rssi"]),
            matched_aps=int(v["matched"]),
        )
        for zid, v in agg.items()
    ]
    ranking.sort(key=lambda s: (s.score, s.best_rssi), reverse=True)

    winner = ranking[0]
    return PositioningResponse(
        zone_id=winner.zone_id,
        zone_name=winner.zone_name,
        confidence=winner.score,  # normalize edilmis pay ~ guven
        ranking=ranking,
    )
