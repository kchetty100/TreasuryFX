from fastapi import APIRouter, Depends, status

from app.api.deps import get_alert_service
from app.schemas.alerts import AlertCreate, AlertListResponse, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    service: AlertService = Depends(get_alert_service),
) -> AlertResponse:
    return service.create(payload)


@router.get("", response_model=AlertListResponse)
def list_alerts(
    service: AlertService = Depends(get_alert_service),
) -> AlertListResponse:
    items = service.list_alerts()
    return AlertListResponse(items=items, count=len(items))


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    service: AlertService = Depends(get_alert_service),
) -> None:
    service.delete(alert_id)
