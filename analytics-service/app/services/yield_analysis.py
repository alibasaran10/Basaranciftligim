"""Tarla verim analizi.

Tarlaya islenen operasyonlardan (suruldu/bicildi/hasat/balya vb.) verim
metrikleri cikarir: toplam balya, hektar basina verim, operasyon sayimlari.
"""
from __future__ import annotations

from collections import Counter

from ..schemas import YieldRequest, YieldResponse

BALED = "balyalandi"
HARVESTED = "hasat_edildi"


def analyze_yield(req: YieldRequest) -> YieldResponse:
    op_counts: Counter[str] = Counter()
    total_bales = 0.0
    yield_metrics_sum: dict[str, float] = {}
    notes: list[str] = []

    for op in req.operations:
        op_counts[op.type] += 1
        for key, value in op.metrics.items():
            yield_metrics_sum[key] = yield_metrics_sum.get(key, 0.0) + float(value)
            if op.type == BALED and key in ("baleCount", "balya", "balya_sayisi"):
                total_bales += float(value)

    # Hektar basina verim (toplanabilir sayisal metrikler icin).
    per_hectare = {
        key: round(total / req.area_hectares, 3) for key, total in yield_metrics_sum.items()
    }

    if op_counts.get(HARVESTED, 0) == 0:
        notes.append("Bu tarla icin henuz hasat kaydi yok.")
    if total_bales > 0:
        notes.append(f"Toplam {int(total_bales)} balya; hektar basina {round(total_bales / req.area_hectares, 2)}.")

    return YieldResponse(
        field_name=req.field_name,
        total_bales=round(total_bales, 2),
        yield_per_hectare=per_hectare,
        operation_counts=dict(op_counts),
        notes=notes,
    )
