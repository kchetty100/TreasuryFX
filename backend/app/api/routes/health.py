from fastapi import APIRouter, Depends

from app.api.deps import get_health_service
from app.schemas.health import CacheStatsResponse, HealthResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
def health_check(service: HealthService = Depends(get_health_service)) -> HealthResponse:
    return service.get_health()


@router.get("/cache", response_model=CacheStatsResponse)
def cache_stats(service: HealthService = Depends(get_health_service)) -> CacheStatsResponse:
    return service.get_cache_stats()
