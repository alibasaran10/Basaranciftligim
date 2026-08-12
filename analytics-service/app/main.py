"""Python Analiz Mikroservisi (FastAPI).

Node backend'in cagirdigi analitik uclar:
  - POST /positioning/resolve : gelismis RSSI konumlandirma
  - POST /motion/classify     : pencere-tabanli hareket siniflandirma
  - POST /yield/analyze       : tarla verim analizi
  - GET  /health              : saglik kontrolu (kimlik gerektirmez)

Guvenlik: /health disindaki uclar "x-service-key" ister. Servis ic agda
tutulmali, disariya acilmamalidir.
"""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .security import require_service_key
from .schemas import (
    PositioningRequest,
    PositioningResponse,
    MotionRequest,
    MotionResponse,
    YieldRequest,
    YieldResponse,
)
from .services.positioning import resolve_position
from .services.motion import classify_motion
from .services.yield_analysis import analyze_yield

settings = get_settings()

app = FastAPI(
    title="Akilli Ciftlik - Analiz Servisi",
    version="1.0.0",
    docs_url=None if settings.is_prod else "/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["x-service-key", "content-type"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "analytics", "env": settings.env}


@app.post(
    "/positioning/resolve",
    response_model=PositioningResponse,
    dependencies=[Depends(require_service_key)],
)
async def positioning(req: PositioningRequest) -> PositioningResponse:
    return resolve_position(req)


@app.post(
    "/motion/classify",
    response_model=MotionResponse,
    dependencies=[Depends(require_service_key)],
)
async def motion(req: MotionRequest) -> MotionResponse:
    return classify_motion(req)


@app.post(
    "/yield/analyze",
    response_model=YieldResponse,
    dependencies=[Depends(require_service_key)],
)
async def yield_analyze(req: YieldRequest) -> YieldResponse:
    return analyze_yield(req)


def run() -> None:
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=not settings.is_prod)


if __name__ == "__main__":
    run()
