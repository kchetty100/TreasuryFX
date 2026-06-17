from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_exposure_service
from app.db.models import ExposureStatus, ExposureType
from app.schemas.exposure import ExposureCreate, ExposureListResponse, ExposureResponse, ExposureUpdate
from app.services.exposure_service import ExposureService

router = APIRouter(prefix="/exposures", tags=["Exposures"])


@router.get("", response_model=ExposureListResponse)
def list_exposures(
    currency: str | None = Query(default=None, min_length=3, max_length=3),
    exposure_type: ExposureType | None = None,
    status_filter: ExposureStatus | None = Query(default=None, alias="status"),
    business_unit: str | None = None,
    service: ExposureService = Depends(get_exposure_service),
) -> ExposureListResponse:
    return service.list_exposures(currency, exposure_type, status_filter, business_unit)


@router.post("", response_model=ExposureResponse, status_code=status.HTTP_201_CREATED)
def create_exposure(
    payload: ExposureCreate,
    service: ExposureService = Depends(get_exposure_service),
) -> ExposureResponse:
    return service.create(payload)


@router.get("/{exposure_id}", response_model=ExposureResponse)
def get_exposure(
    exposure_id: int,
    service: ExposureService = Depends(get_exposure_service),
) -> ExposureResponse:
    return service.get(exposure_id)


@router.put("/{exposure_id}", response_model=ExposureResponse)
def update_exposure(
    exposure_id: int,
    payload: ExposureUpdate,
    service: ExposureService = Depends(get_exposure_service),
) -> ExposureResponse:
    return service.update(exposure_id, payload)


@router.delete("/{exposure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exposure(
    exposure_id: int,
    service: ExposureService = Depends(get_exposure_service),
) -> None:
    service.delete(exposure_id)
