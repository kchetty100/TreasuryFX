from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_currency_service
from app.external.currency_client import CurrencyAPIError
from app.schemas.currency import ConvertResponse, HistoricalRatesResponse, LatestRatesResponse
from app.services.currency_service import CurrencyService

router = APIRouter(prefix="/rates", tags=["Exchange Rates"])


@router.get("/latest", response_model=LatestRatesResponse)
def get_latest_rates(
    base: str = Query("USD", min_length=3, max_length=3),
    symbols: str | None = Query(None, description="Comma-separated currency codes"),
    service: CurrencyService = Depends(get_currency_service),
) -> LatestRatesResponse:
    symbol_list = [s.strip().upper() for s in symbols.split(",")] if symbols else None
    try:
        data = service.get_latest_rates(base.upper(), symbol_list)
        return LatestRatesResponse(base=data["base"], date=data["date"], rates=data["rates"])
    except CurrencyAPIError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/convert", response_model=ConvertResponse)
def convert_currency(
    from_currency: str = Query(..., alias="from", min_length=3, max_length=3),
    to_currency: str = Query(..., alias="to", min_length=3, max_length=3),
    amount: float = Query(..., gt=0),
    service: CurrencyService = Depends(get_currency_service),
) -> ConvertResponse:
    try:
        result = service.convert(from_currency, to_currency, amount)
        return ConvertResponse(**result)
    except CurrencyAPIError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/history", response_model=HistoricalRatesResponse)
def get_historical_rates(
    from_currency: str = Query(..., alias="from", min_length=3, max_length=3),
    to_currency: str = Query(..., alias="to", min_length=3, max_length=3),
    start_date: date = Query(...),
    end_date: date = Query(...),
    service: CurrencyService = Depends(get_currency_service),
) -> HistoricalRatesResponse:
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )
    try:
        result = service.get_historical_rates(from_currency, to_currency, start_date, end_date)
        return HistoricalRatesResponse(**result)
    except CurrencyAPIError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
