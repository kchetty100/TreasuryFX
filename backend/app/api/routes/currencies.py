from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_currency_service
from app.external.currency_client import CurrencyAPIError
from app.schemas.currency import CurrencyListResponse
from app.services.currency_service import CurrencyService

router = APIRouter(prefix="/currencies", tags=["Currencies"])


@router.get("", response_model=CurrencyListResponse)
def list_currencies(service: CurrencyService = Depends(get_currency_service)) -> CurrencyListResponse:
    try:
        currencies = service.get_currencies()
        return CurrencyListResponse(currencies=currencies, count=len(currencies))
    except CurrencyAPIError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
