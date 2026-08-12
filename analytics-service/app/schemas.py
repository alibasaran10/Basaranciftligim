"""Istek/yanit semalari (Pydantic) - kati girdi dogrulama.

Not: Python 3.9 uyumlulugu icin typing.Optional/List/Dict kullanilir
(PEP 604 "X | Y" runtime birlesimi 3.10+ gerektirir).
"""
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class RssiScan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    bssid: str = Field(..., max_length=20)
    rssi: int = Field(..., ge=-120, le=0)


class ZoneFingerprint(BaseModel):
    """Bir bolgenin AP parmak izi: hangi BSSID'lerin tipik gorulur oldugu."""
    model_config = ConfigDict(extra="forbid")
    zone_id: str
    zone_name: str
    router_macs: List[str] = Field(default_factory=list, max_length=50)


class PositioningRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scans: List[RssiScan] = Field(..., max_length=50)
    zones: List[ZoneFingerprint] = Field(..., max_length=200)
    min_rssi: int = Field(default=-85, ge=-120, le=0)


class ZoneScore(BaseModel):
    zone_id: str
    zone_name: str
    score: float
    best_rssi: int
    matched_aps: int


class PositioningResponse(BaseModel):
    zone_id: Optional[str]
    zone_name: Optional[str]
    confidence: float  # 0..1
    ranking: List[ZoneScore]


class AccelSample(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x: float
    y: float
    z: float


class MotionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # Bir pencere icindeki ardisik ivme ornekleri (tercihen 'g' biriminde).
    samples: List[AccelSample] = Field(..., min_length=1, max_length=500)
    sample_rate_hz: float = Field(default=1.0, gt=0, le=1000)


class MotionResponse(BaseModel):
    state: str  # aktif/yatiyor/kosuyor/otluyor/bilinmiyor
    mean_magnitude: float
    magnitude_std: float
    activity_index: float


class FieldOperation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str
    date: Optional[str] = None
    metrics: Dict[str, float] = Field(default_factory=dict)


class YieldRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    field_name: str
    area_hectares: float = Field(..., gt=0)
    operations: List[FieldOperation] = Field(default_factory=list, max_length=1000)


class YieldResponse(BaseModel):
    field_name: str
    total_bales: float
    yield_per_hectare: Dict[str, float]
    operation_counts: Dict[str, int]
    notes: List[str]
