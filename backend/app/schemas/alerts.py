from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AlertDirectionEnum(str, Enum):
    ABOVE = "above"
    BELOW = "below"


class AlertCreate(BaseModel):
    base_currency: str = Field(..., min_length=3, max_length=3)
    target_currency: str = Field(..., min_length=3, max_length=3)
    threshold: float = Field(..., gt=0)
    direction: AlertDirectionEnum


class AlertResponse(BaseModel):
    id: int
    base_currency: str
    target_currency: str
    threshold: float
    direction: AlertDirectionEnum
    is_active: bool
    created_at: datetime
    current_rate: float | None = None
    triggered: bool | None = None

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    items: list[AlertResponse]
    count: int
