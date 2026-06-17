import json
from typing import Any

import redis

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class RedisCache:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = redis.from_url(settings.redis_url, decode_responses=True)
        self._default_ttl = settings.cache_ttl_seconds

    def get(self, key: str) -> Any | None:
        try:
            value = self._client.get(key)
            if value is None:
                return None
            return json.loads(value)
        except (redis.RedisError, json.JSONDecodeError) as exc:
            logger.warning("cache_get_failed", key=key, error=str(exc))
            return None

    def set(self, key: str, value: Any, ttl: int | None = None) -> bool:
        try:
            self._client.setex(key, ttl or self._default_ttl, json.dumps(value))
            return True
        except redis.RedisError as exc:
            logger.warning("cache_set_failed", key=key, error=str(exc))
            return False

    def delete(self, key: str) -> None:
        try:
            self._client.delete(key)
        except redis.RedisError as exc:
            logger.warning("cache_delete_failed", key=key, error=str(exc))

    def get_stats(self) -> dict[str, Any]:
        try:
            info = self._client.info()
            return {
                "connected": True,
                "used_memory_human": info.get("used_memory_human", "unknown"),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "connected_clients": info.get("connected_clients", 0),
            }
        except redis.RedisError as exc:
            logger.warning("cache_stats_failed", error=str(exc))
            return {"connected": False, "error": str(exc)}

    def ping(self) -> bool:
        try:
            return bool(self._client.ping())
        except redis.RedisError:
            return False


_cache: RedisCache | None = None


def get_cache() -> RedisCache:
    global _cache
    if _cache is None:
        _cache = RedisCache()
    return _cache
