from datetime import datetime

from pydantic import BaseModel, Field


class WatchlistCreate(BaseModel):
    base_currency: str = Field(..., min_length=3, max_length=3)
    target_currency: str = Field(..., min_length=3, max_length=3)


class WatchlistItemResponse(BaseModel):
    id: int
    base_currency: str
    target_currency: str
    created_at: datetime
    current_rate: float | None = None
    trend_direction: str | None = None

    model_config = {"from_attributes": True}


class WatchlistListResponse(BaseModel):
    items: list[WatchlistItemResponse]
    count: int
