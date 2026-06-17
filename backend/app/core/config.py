from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TreasuryFX"
    app_env: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    database_url: str = "postgresql://fxpilot:fxpilot@localhost:5432/fxpilot"
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 300

    frankfurter_base_url: str = "https://api.frankfurter.app"
    currency_api_timeout: float = 10.0
    currency_api_max_retries: int = 3
    circuit_breaker_failure_threshold: int = 5
    circuit_breaker_recovery_timeout: int = 60

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
