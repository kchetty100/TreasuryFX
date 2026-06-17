from datetime import date
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.core.logging import get_logger
from app.external.circuit_breaker import CircuitBreaker

logger = get_logger(__name__)


class CurrencyAPIError(Exception):
    pass


class CircuitBreakerOpenError(CurrencyAPIError):
    pass


class FrankfurterClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.frankfurter_base_url.rstrip("/")
        self.timeout = settings.currency_api_timeout
        self._circuit_breaker = CircuitBreaker(
            failure_threshold=settings.circuit_breaker_failure_threshold,
            recovery_timeout=settings.circuit_breaker_recovery_timeout,
        )

    @property
    def circuit_status(self) -> dict:
        return self._circuit_breaker.get_status()

    def _request(self, path: str, params: dict | None = None) -> dict[str, Any]:
        if not self._circuit_breaker.allow_request():
            raise CircuitBreakerOpenError("Currency API circuit breaker is open")

        @retry(
            retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
            stop=stop_after_attempt(get_settings().currency_api_max_retries),
            wait=wait_exponential(multiplier=1, min=1, max=8),
            reraise=True,
        )
        def _do_request() -> dict[str, Any]:
            url = f"{self.base_url}{path}"
            logger.info("currency_api_request", url=url, params=params)
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                return response.json()

        try:
            data = _do_request()
            self._circuit_breaker.record_success()
            return data
        except Exception as exc:
            self._circuit_breaker.record_failure()
            logger.error("currency_api_request_failed", path=path, error=str(exc))
            raise CurrencyAPIError(f"Failed to fetch from Frankfurter API: {exc}") from exc

    def get_currencies(self) -> dict[str, str]:
        return self._request("/currencies")

    def get_latest_rates(self, base: str, symbols: list[str] | None = None) -> dict[str, Any]:
        params: dict[str, str] = {"from": base.upper()}
        if symbols:
            params["to"] = ",".join(s.upper() for s in symbols)
        return self._request("/latest", params=params)

    def convert(
        self, from_currency: str, to_currency: str, amount: float
    ) -> dict[str, Any]:
        return self._request(
            "/latest",
            params={
                "amount": str(amount),
                "from": from_currency.upper(),
                "to": to_currency.upper(),
            },
        )

    def get_historical_rates(
        self,
        from_currency: str,
        to_currency: str,
        start_date: date,
        end_date: date,
    ) -> dict[str, Any]:
        return self._request(
            f"/{start_date.isoformat()}..{end_date.isoformat()}",
            params={"from": from_currency.upper(), "to": to_currency.upper()},
        )


_client: FrankfurterClient | None = None


def get_currency_client() -> FrankfurterClient:
    global _client
    if _client is None:
        _client = FrankfurterClient()
    return _client
