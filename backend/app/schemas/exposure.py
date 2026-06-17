from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class ExposureTypeEnum(str, Enum):
    PAYABLE = "PAYABLE"
    RECEIVABLE = "RECEIVABLE"


class ExposureStatusEnum(str, Enum):
    OPEN = "OPEN"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"


class RiskLevelEnum(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ExposureCreate(BaseModel):
    counterparty: str = Field(..., min_length=1, max_length=120)
    exposure_type: ExposureTypeEnum
    currency: str = Field(..., min_length=3, max_length=3)
    amount: float = Field(..., gt=0)
    due_date: date
    business_unit: str = Field(..., min_length=1, max_length=80)
    description: str | None = None
    status: ExposureStatusEnum = ExposureStatusEnum.OPEN


class ExposureUpdate(BaseModel):
    counterparty: str | None = Field(None, min_length=1, max_length=120)
    exposure_type: ExposureTypeEnum | None = None
    currency: str | None = Field(None, min_length=3, max_length=3)
    amount: float | None = Field(None, gt=0)
    due_date: date | None = None
    business_unit: str | None = Field(None, min_length=1, max_length=80)
    description: str | None = None
    status: ExposureStatusEnum | None = None


class ExposureResponse(BaseModel):
    id: int
    counterparty: str
    exposure_type: ExposureTypeEnum
    currency: str
    amount: float
    due_date: date
    business_unit: str
    description: str | None = None
    status: ExposureStatusEnum
    created_at: datetime
    updated_at: datetime
    fx_rate_to_zar: float | None = None
    zar_equivalent: float | None = None
    days_until_due: int | None = None
    risk_level: RiskLevelEnum | None = None

    model_config = {"from_attributes": True}


class ExposureListResponse(BaseModel):
    items: list[ExposureResponse]
    count: int


class TreasurySummaryResponse(BaseModel):
    total_exposure_zar: float
    payables_total_zar: float
    receivables_total_zar: float
    net_exposure_zar: float
    exposure_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


class ExposureByCurrencyResponse(BaseModel):
    currency: str
    amount: float
    zar_equivalent: float
    payable_zar: float
    receivable_zar: float
    net_zar: float


class ExposureByCurrencyListResponse(BaseModel):
    items: list[ExposureByCurrencyResponse]


class UpcomingMaturitiesResponse(BaseModel):
    items: list[ExposureResponse]
