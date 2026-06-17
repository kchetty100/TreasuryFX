from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import WatchlistItem
from app.schemas.watchlist import WatchlistCreate, WatchlistItemResponse
from app.services.currency_service import CurrencyService


class WatchlistService:
    def __init__(self, db: Session, currency_service: CurrencyService) -> None:
        self.db = db
        self.currency_service = currency_service

    def create(self, payload: WatchlistCreate) -> WatchlistItemResponse:
        base = payload.base_currency.upper()
        target = payload.target_currency.upper()
        if base == target:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Base and target currencies must differ",
            )

        existing = (
            self.db.query(WatchlistItem)
            .filter(
                WatchlistItem.base_currency == base,
                WatchlistItem.target_currency == target,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Currency pair already in watchlist",
            )

        item = WatchlistItem(base_currency=base, target_currency=target)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return self._enrich(item)

    def list_items(self) -> list[WatchlistItemResponse]:
        items = self.db.query(WatchlistItem).order_by(WatchlistItem.created_at.desc()).all()
        return [self._enrich(item) for item in items]

    def delete(self, item_id: int) -> None:
        item = self.db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found")
        self.db.delete(item)
        self.db.commit()

    def _enrich(self, item: WatchlistItem) -> WatchlistItemResponse:
        rate = self.currency_service.get_pair_rate(item.base_currency, item.target_currency)
        trend = self.currency_service.get_trend_direction(item.base_currency, item.target_currency)
        return WatchlistItemResponse(
            id=item.id,
            base_currency=item.base_currency,
            target_currency=item.target_currency,
            created_at=item.created_at,
            current_rate=rate,
            trend_direction=trend,
        )
