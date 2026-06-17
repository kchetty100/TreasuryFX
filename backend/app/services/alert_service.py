from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import AlertDirection, ExchangeRateAlert
from app.schemas.alerts import AlertCreate, AlertResponse
from app.services.currency_service import CurrencyService


class AlertService:
    def __init__(self, db: Session, currency_service: CurrencyService) -> None:
        self.db = db
        self.currency_service = currency_service

    def create(self, payload: AlertCreate) -> AlertResponse:
        base = payload.base_currency.upper()
        target = payload.target_currency.upper()
        if base == target:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Base and target currencies must differ",
            )

        alert = ExchangeRateAlert(
            base_currency=base,
            target_currency=target,
            threshold=payload.threshold,
            direction=AlertDirection(payload.direction.value),
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return self._enrich(alert)

    def list_alerts(self) -> list[AlertResponse]:
        alerts = (
            self.db.query(ExchangeRateAlert)
            .filter(ExchangeRateAlert.is_active.is_(True))
            .order_by(ExchangeRateAlert.created_at.desc())
            .all()
        )
        return [self._enrich(alert) for alert in alerts]

    def delete(self, alert_id: int) -> None:
        alert = self.db.query(ExchangeRateAlert).filter(ExchangeRateAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
        self.db.delete(alert)
        self.db.commit()

    def _enrich(self, alert: ExchangeRateAlert) -> AlertResponse:
        current_rate = self.currency_service.get_pair_rate(alert.base_currency, alert.target_currency)
        triggered = None
        if current_rate is not None:
            if alert.direction == AlertDirection.ABOVE:
                triggered = current_rate >= alert.threshold
            else:
                triggered = current_rate <= alert.threshold

        return AlertResponse(
            id=alert.id,
            base_currency=alert.base_currency,
            target_currency=alert.target_currency,
            threshold=alert.threshold,
            direction=alert.direction.value,
            is_active=alert.is_active,
            created_at=alert.created_at,
            current_rate=current_rate,
            triggered=triggered,
        )
