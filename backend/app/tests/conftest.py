import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.main import create_app


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session, monkeypatch):
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    class MockCache:
        def get(self, key):
            return None

        def set(self, key, value, ttl=None):
            return True

        def delete(self, key):
            pass

        def get_stats(self):
            return {"connected": True, "used_memory_human": "1M", "keyspace_hits": 0, "keyspace_misses": 0}

        def ping(self):
            return True

    class MockClient:
        circuit_status = {"state": "closed", "failure_count": 0}

        def get_currencies(self):
            return {"USD": "United States Dollar", "EUR": "Euro", "ZAR": "South African Rand"}

        def get_latest_rates(self, base, symbols=None):
            rates = {"EUR": 0.92, "ZAR": 18.5, "GBP": 0.79}
            if symbols:
                rates = {k: v for k, v in rates.items() if k in symbols}
            return {"base": base.upper(), "date": "2025-06-17", "rates": rates}

        def convert(self, from_currency, to_currency, amount):
            rate = 18.5 if to_currency.upper() == "ZAR" else 0.92
            return {
                "amount": amount,
                "base": from_currency.upper(),
                "date": "2025-06-17",
                "rates": {to_currency.upper(): amount * rate},
            }

        def get_historical_rates(self, from_currency, to_currency, start_date, end_date):
            return {
                "base": from_currency.upper(),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "rates": {
                    "2025-06-01": {to_currency.upper(): 18.0},
                    "2025-06-17": {to_currency.upper(): 18.5},
                },
            }

    from app.cache import redis_cache
    from app.external import currency_client

    monkeypatch.setattr(redis_cache, "get_cache", lambda: MockCache())
    monkeypatch.setattr(currency_client, "get_currency_client", lambda: MockClient())

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
