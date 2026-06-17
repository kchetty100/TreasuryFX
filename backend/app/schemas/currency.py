from pydantic import BaseModel, Field


class CurrencyListResponse(BaseModel):
    currencies: dict[str, str]
    count: int


class LatestRatesResponse(BaseModel):
    base: str
    date: str
    rates: dict[str, float]


class ConvertRequest(BaseModel):
    from_currency: str = Field(..., alias="from", min_length=3, max_length=3)
    to_currency: str = Field(..., alias="to", min_length=3, max_length=3)
    amount: float = Field(..., gt=0)

    model_config = {"populate_by_name": True}


class ConvertResponse(BaseModel):
    from_currency: str
    to_currency: str
    amount: float
    rate: float
    result: float
    date: str


class HistoricalRatesResponse(BaseModel):
    base: str
    start_date: str
    end_date: str
    rates: dict[str, dict[str, float]]
