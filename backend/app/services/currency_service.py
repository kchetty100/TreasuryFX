from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.cache.redis_cache import RedisCache
from app.core.logging import get_logger
from app.external.currency_client import CurrencyAPIError, FrankfurterClient

logger = get_logger(__name__)

_last_refresh: datetime | None = None


def get_last_refresh() -> datetime | None:
    return _last_refresh


def _set_last_refresh() -> None:
    global _last_refresh
    _last_refresh = datetime.utcnow()


class CurrencyService:
    def __init__(self, client: FrankfurterClient, cache: RedisCache) -> None:
        self.client = client
        self.cache = cache

    def get_currencies(self) -> dict[str, str]:
        cache_key = "currencies:all"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        currencies = self.client.get_currencies()
        self.cache.set(cache_key, currencies, ttl=86400)
        _set_last_refresh()
        return currencies

    def get_latest_rates(self, base: str, symbols: list[str] | None = None) -> dict[str, Any]:
        cache_key = f"rates:latest:{base.upper()}:{','.join(symbols or [])}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        data = self.client.get_latest_rates(base, symbols)
        self.cache.set(cache_key, data)
        _set_last_refresh()
        return data

    def convert(self, from_currency: str, to_currency: str, amount: float) -> dict[str, Any]:
        cache_key = f"rates:convert:{from_currency.upper()}:{to_currency.upper()}:{amount}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        data = self.client.convert(from_currency, to_currency, amount)
        converted = data["rates"][to_currency.upper()]
        rate = round(converted / amount, 6) if amount else 0
        result = {
            "from_currency": from_currency.upper(),
            "to_currency": to_currency.upper(),
            "amount": amount,
            "rate": rate,
            "result": round(converted, 4),
            "date": data["date"],
        }
        self.cache.set(cache_key, result, ttl=120)
        _set_last_refresh()
        return result

    def get_historical_rates(
        self, from_currency: str, to_currency: str, start_date: date, end_date: date
    ) -> dict[str, Any]:
        cache_key = (
            f"rates:history:{from_currency.upper()}:{to_currency.upper()}:"
            f"{start_date.isoformat()}:{end_date.isoformat()}"
        )
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        data = self.client.get_historical_rates(from_currency, to_currency, start_date, end_date)
        result = {
            "base": from_currency.upper(),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "rates": data.get("rates", {}),
        }
        self.cache.set(cache_key, result, ttl=3600)
        _set_last_refresh()
        return result

    def get_pair_rate(self, base: str, target: str) -> float | None:
        try:
            data = self.get_latest_rates(base, [target])
            return data.get("rates", {}).get(target.upper())
        except CurrencyAPIError:
            return None

    def get_trend_direction(self, base: str, target: str) -> str | None:
        try:
            end = date.today()
            start = end - timedelta(days=7)
            history = self.get_historical_rates(base, target, start, end)
            rates = history.get("rates", {})
            if len(rates) < 2:
                return None
            sorted_dates = sorted(rates.keys())
            first_rate = rates[sorted_dates[0]].get(target.upper())
            last_rate = rates[sorted_dates[-1]].get(target.upper())
            if first_rate is None or last_rate is None:
                return None
            if last_rate > first_rate:
                return "up"
            if last_rate < first_rate:
                return "down"
            return "flat"
        except CurrencyAPIError:
            return None
