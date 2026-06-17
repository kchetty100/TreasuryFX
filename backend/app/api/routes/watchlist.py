from fastapi import APIRouter, Depends, status

from app.api.deps import get_watchlist_service
from app.schemas.watchlist import WatchlistCreate, WatchlistItemResponse, WatchlistListResponse
from app.services.watchlist_service import WatchlistService

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.post("", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    payload: WatchlistCreate,
    service: WatchlistService = Depends(get_watchlist_service),
) -> WatchlistItemResponse:
    return service.create(payload)


@router.get("", response_model=WatchlistListResponse)
def list_watchlist(
    service: WatchlistService = Depends(get_watchlist_service),
) -> WatchlistListResponse:
    items = service.list_items()
    return WatchlistListResponse(items=items, count=len(items))


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    item_id: int,
    service: WatchlistService = Depends(get_watchlist_service),
) -> None:
    service.delete(item_id)
