"""Servisler arasi kimlik dogrulama.

Node backend her istekte "x-service-key" basligini gonderir. Bu servis
internete acik OLMAMALI; yalnizca ic agdan/Node'dan erisilmelidir. Anahtar
karsilastirmasi zamanlama saldirilarina karsi sabit surelidir.
"""
import hmac
from typing import Optional

from fastapi import Header, HTTPException, status

from .config import get_settings


async def require_service_key(x_service_key: Optional[str] = Header(default=None)) -> None:
    settings = get_settings()
    if not x_service_key or not hmac.compare_digest(x_service_key, settings.service_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gecersiz servis anahtari",
        )
