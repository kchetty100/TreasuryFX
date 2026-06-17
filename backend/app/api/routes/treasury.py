from fastapi import APIRouter, Depends

from app.api.deps import get_exposure_service
from app.schemas.exposure import (
    ExposureByCurrencyListResponse,
    ExposureListResponse,
    TreasurySummaryResponse,
    UpcomingMaturitiesResponse,
)
from app.services.exposure_service import ExposureService

router = APIRouter(prefix="/treasury", tags=["Treasury"])


@router.get("/summary", response_model=TreasurySummaryResponse)
def treasury_summary(service: ExposureService = Depends(get_exposure_service)) -> TreasurySummaryResponse:
    return service.summary()


@router.get("/exposure-by-currency", response_model=ExposureByCurrencyListResponse)
def exposure_by_currency(service: ExposureService = Depends(get_exposure_service)) -> ExposureByCurrencyListResponse:
    return service.exposure_by_currency()


@router.get("/high-risk-exposures", response_model=ExposureListResponse)
def high_risk_exposures(service: ExposureService = Depends(get_exposure_service)) -> ExposureListResponse:
    return service.high_risk_exposures()


@router.get("/upcoming-maturities", response_model=UpcomingMaturitiesResponse)
def upcoming_maturities(service: ExposureService = Depends(get_exposure_service)) -> UpcomingMaturitiesResponse:
    return service.upcoming_maturities()
