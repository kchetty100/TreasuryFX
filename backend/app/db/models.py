from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
import enum


class AlertDirection(str, enum.Enum):
    ABOVE = "above"
    BELOW = "below"


class ExposureType(str, enum.Enum):
    PAYABLE = "PAYABLE"
    RECEIVABLE = "RECEIVABLE"


class ExposureStatus(str, enum.Enum):
    OPEN = "OPEN"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    target_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ExchangeRateAlert(Base):
    __tablename__ = "exchange_rate_alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    target_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[AlertDirection] = mapped_column(Enum(AlertDirection), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Exposure(Base):
    __tablename__ = "exposures"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    counterparty: Mapped[str] = mapped_column(String(120), nullable=False)
    exposure_type: Mapped[ExposureType] = mapped_column(Enum(ExposureType), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    business_unit: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ExposureStatus] = mapped_column(Enum(ExposureStatus), nullable=False, default=ExposureStatus.OPEN)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
