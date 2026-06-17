from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.cache.redis_cache import RedisCache
from app.core.config import get_settings
from app.external.currency_client import FrankfurterClient
from app.schemas.health import CacheStatsResponse, HealthResponse
from app.services.currency_service import get_last_refresh


class HealthService:
    def __init__(self, db: Session, cache: RedisCache, client: FrankfurterClient) -> None:
        self.db = db
        self.cache = cache
        self.client = client

    def get_health(self) -> HealthResponse:
        db_ok = self._check_database()
        redis_ok = self.cache.ping()
        api_status = self.client.circuit_status

        overall = "healthy" if db_ok and redis_ok and api_status["state"] != "open" else "degraded"
        return HealthResponse(
            status=overall,
            database=db_ok,
            redis=redis_ok,
            currency_api=api_status,
            timestamp=datetime.utcnow(),
        )

    def get_cache_stats(self) -> CacheStatsResponse:
        stats = self.cache.get_stats()
        settings = get_settings()
        return CacheStatsResponse(
            connected=stats.get("connected", False),
            used_memory_human=stats.get("used_memory_human"),
            keyspace_hits=stats.get("keyspace_hits"),
            keyspace_misses=stats.get("keyspace_misses"),
            connected_clients=stats.get("connected_clients"),
            error=stats.get("error"),
            cache_ttl_seconds=settings.cache_ttl_seconds,
            last_refresh=get_last_refresh(),
        )

    def _check_database(self) -> bool:
        try:
            self.db.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
