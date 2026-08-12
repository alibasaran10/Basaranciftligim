"""Merkezi, dogrulanmis ayarlar (pydantic-settings)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8000
    env: str = "development"

    # Node backend ile paylasilan servis anahtari (x-service-key).
    service_api_key: str = "change-me"

    allowed_origins: str = "http://localhost:4000"

    @property
    def is_prod(self) -> bool:
        return self.env == "production"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
