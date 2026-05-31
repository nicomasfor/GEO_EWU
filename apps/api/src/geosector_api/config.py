from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    overpass_api_url: str = "https://overpass-api.de/api/interpreter"
    overpass_api_urls: str = (
        "https://overpass-api.de/api/interpreter,"
        "https://overpass.kumi.systems/api/interpreter,"
        "https://overpass.openstreetmap.ru/api/interpreter"
    )
    overpass_tile_delay_seconds: float = 1.2
    overpass_max_retries: int = 4
    convex_url: str = ""
    convex_admin_key: str = ""
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
