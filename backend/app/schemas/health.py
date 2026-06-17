from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: bool
    redis: bool
    currency_api: dict
    timestamp: datetime


class CacheStatsResponse(BaseModel):
    connected: bool
    used_memory_human: str | None = None
    keyspace_hits: int | None = None
    keyspace_misses: int | None = None
    connected_clients: int | None = None
    error: str | None = None
    cache_ttl_seconds: int
    last_refresh: datetime | None = None
