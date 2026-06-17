from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.cache.redis_cache import RedisCache, get_cache
from app.db.database import get_db
from app.external.currency_client import FrankfurterClient, get_currency_client
from app.services.alert_service import AlertService
from app.services.currency_service import CurrencyService
from app.services.exposure_service import ExposureService
from app.services.health_service import HealthService
from app.services.watchlist_service import WatchlistService


def get_currency_service(
    client: FrankfurterClient = Depends(get_currency_client),
    cache: RedisCache = Depends(get_cache),
) -> CurrencyService:
    return CurrencyService(client, cache)


def get_watchlist_service(
    db: Session = Depends(get_db),
    currency_service: CurrencyService = Depends(get_currency_service),
) -> WatchlistService:
    return WatchlistService(db, currency_service)


def get_alert_service(
    db: Session = Depends(get_db),
    currency_service: CurrencyService = Depends(get_currency_service),
) -> AlertService:
    return AlertService(db, currency_service)


def get_exposure_service(
    db: Session = Depends(get_db),
    currency_service: CurrencyService = Depends(get_currency_service),
) -> ExposureService:
    return ExposureService(db, currency_service)


def get_health_service(
    db: Session = Depends(get_db),
    cache: RedisCache = Depends(get_cache),
    client: FrankfurterClient = Depends(get_currency_client),
) -> HealthService:
    return HealthService(db, cache, client)
