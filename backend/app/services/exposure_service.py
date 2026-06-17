from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Exposure, ExposureStatus, ExposureType
from app.schemas.exposure import (
    ExposureByCurrencyListResponse,
    ExposureByCurrencyResponse,
    ExposureCreate,
    ExposureListResponse,
    ExposureResponse,
    ExposureUpdate,
    TreasurySummaryResponse,
    UpcomingMaturitiesResponse,
)
from app.services.currency_service import CurrencyService


DEMO_RATES_TO_ZAR = {
    "ZAR": 1.0,
    "USD": 18.25,
    "EUR": 19.75,
    "GBP": 23.10,
    "JPY": 0.12,
    "CHF": 20.60,
    "CAD": 13.40,
    "AUD": 12.10,
    "CNY": 2.52,
}


class ExposureService:
    def __init__(self, db: Session, currency_service: CurrencyService) -> None:
        self.db = db
        self.currency_service = currency_service

    def list_exposures(
        self,
        currency: str | None = None,
        exposure_type: ExposureType | None = None,
        status_filter: ExposureStatus | None = None,
        business_unit: str | None = None,
    ) -> ExposureListResponse:
        query = self.db.query(Exposure)
        if currency:
            query = query.filter(Exposure.currency == currency.upper())
        if exposure_type:
            query = query.filter(Exposure.exposure_type == exposure_type)
        if status_filter:
            query = query.filter(Exposure.status == status_filter)
        if business_unit:
            query = query.filter(Exposure.business_unit.ilike(f"%{business_unit}%"))

        items = query.order_by(Exposure.due_date.asc(), Exposure.id.asc()).all()
        enriched = [self._enrich(item) for item in items]
        return ExposureListResponse(items=enriched, count=len(enriched))

    def get(self, exposure_id: int) -> ExposureResponse:
        return self._enrich(self._get_model(exposure_id))

    def create(self, payload: ExposureCreate) -> ExposureResponse:
        item = Exposure(
            counterparty=payload.counterparty,
            exposure_type=ExposureType(payload.exposure_type.value),
            currency=payload.currency.upper(),
            amount=payload.amount,
            due_date=payload.due_date,
            business_unit=payload.business_unit,
            description=payload.description,
            status=ExposureStatus(payload.status.value),
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return self._enrich(item)

    def update(self, exposure_id: int, payload: ExposureUpdate) -> ExposureResponse:
        item = self._get_model(exposure_id)
        updates = payload.model_dump(exclude_unset=True)
        if "currency" in updates and updates["currency"]:
            updates["currency"] = updates["currency"].upper()
        if "exposure_type" in updates and updates["exposure_type"]:
            updates["exposure_type"] = ExposureType(updates["exposure_type"].value)
        if "status" in updates and updates["status"]:
            updates["status"] = ExposureStatus(updates["status"].value)

        for key, value in updates.items():
            setattr(item, key, value)

        self.db.commit()
        self.db.refresh(item)
        return self._enrich(item)

    def delete(self, exposure_id: int) -> None:
        item = self._get_model(exposure_id)
        self.db.delete(item)
        self.db.commit()

    def summary(self) -> TreasurySummaryResponse:
        exposures = self._open_exposures()
        enriched = [self._enrich(item) for item in exposures]
        payables = sum((e.zar_equivalent or 0) for e in enriched if e.exposure_type == ExposureType.PAYABLE.value)
        receivables = sum((e.zar_equivalent or 0) for e in enriched if e.exposure_type == ExposureType.RECEIVABLE.value)
        return TreasurySummaryResponse(
            total_exposure_zar=round(payables + receivables, 2),
            payables_total_zar=round(payables, 2),
            receivables_total_zar=round(receivables, 2),
            net_exposure_zar=round(receivables - payables, 2),
            exposure_count=len(enriched),
            high_risk_count=sum(1 for e in enriched if e.risk_level == "HIGH"),
            medium_risk_count=sum(1 for e in enriched if e.risk_level == "MEDIUM"),
            low_risk_count=sum(1 for e in enriched if e.risk_level == "LOW"),
        )

    def exposure_by_currency(self) -> ExposureByCurrencyListResponse:
        buckets: dict[str, dict[str, float]] = {}
        for item in self._open_exposures():
            enriched = self._enrich(item)
            bucket = buckets.setdefault(
                enriched.currency,
                {"amount": 0.0, "zar": 0.0, "payable": 0.0, "receivable": 0.0},
            )
            bucket["amount"] += enriched.amount
            bucket["zar"] += enriched.zar_equivalent or 0
            if enriched.exposure_type == ExposureType.PAYABLE.value:
                bucket["payable"] += enriched.zar_equivalent or 0
            else:
                bucket["receivable"] += enriched.zar_equivalent or 0

        items = [
            ExposureByCurrencyResponse(
                currency=currency,
                amount=round(values["amount"], 2),
                zar_equivalent=round(values["zar"], 2),
                payable_zar=round(values["payable"], 2),
                receivable_zar=round(values["receivable"], 2),
                net_zar=round(values["receivable"] - values["payable"], 2),
            )
            for currency, values in sorted(buckets.items())
        ]
        return ExposureByCurrencyListResponse(items=items)

    def high_risk_exposures(self) -> ExposureListResponse:
        items = [self._enrich(item) for item in self._open_exposures()]
        high_risk = [item for item in items if item.risk_level == "HIGH"]
        high_risk.sort(key=lambda item: (item.days_until_due or 9999, -(item.zar_equivalent or 0)))
        return ExposureListResponse(items=high_risk, count=len(high_risk))

    def upcoming_maturities(self) -> UpcomingMaturitiesResponse:
        items = [self._enrich(item) for item in self._open_exposures()]
        items.sort(key=lambda item: (item.days_until_due if item.days_until_due is not None else 9999))
        return UpcomingMaturitiesResponse(items=items[:8])

    def _open_exposures(self) -> list[Exposure]:
        return (
            self.db.query(Exposure)
            .filter(Exposure.status == ExposureStatus.OPEN)
            .order_by(Exposure.due_date.asc())
            .all()
        )

    def _get_model(self, exposure_id: int) -> Exposure:
        item = self.db.query(Exposure).filter(Exposure.id == exposure_id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exposure not found")
        return item

    def _rate_to_zar(self, currency: str) -> float:
        code = currency.upper()
        if code == "ZAR":
            return 1.0
        rate = self.currency_service.get_pair_rate(code, "ZAR")
        return float(rate or DEMO_RATES_TO_ZAR.get(code, 0))

    def _risk_level(self, zar_equivalent: float, days_until_due: int) -> str:
        if zar_equivalent > 1_000_000 or days_until_due <= 7:
            return "HIGH"
        if zar_equivalent > 250_000 or days_until_due <= 30:
            return "MEDIUM"
        return "LOW"

    def _enrich(self, item: Exposure) -> ExposureResponse:
        rate = self._rate_to_zar(item.currency)
        zar_equivalent = round(item.amount * rate, 2)
        days_until_due = (item.due_date - date.today()).days
        return ExposureResponse(
            id=item.id,
            counterparty=item.counterparty,
            exposure_type=item.exposure_type.value,
            currency=item.currency,
            amount=item.amount,
            due_date=item.due_date,
            business_unit=item.business_unit,
            description=item.description,
            status=item.status.value,
            created_at=item.created_at,
            updated_at=item.updated_at,
            fx_rate_to_zar=round(rate, 6),
            zar_equivalent=zar_equivalent,
            days_until_due=days_until_due,
            risk_level=self._risk_level(zar_equivalent, days_until_due),
        )
