def test_latest_rates(client):
    response = client.get("/api/v1/rates/latest?base=USD")
    assert response.status_code == 200
    data = response.json()
    assert data["base"] == "USD"
    assert "EUR" in data["rates"]


def test_convert_currency(client):
    response = client.get("/api/v1/rates/convert?from=USD&to=ZAR&amount=100")
    assert response.status_code == 200
    data = response.json()
    assert data["from_currency"] == "USD"
    assert data["to_currency"] == "ZAR"
    assert data["amount"] == 100
    assert data["result"] == 1850.0


def test_historical_rates(client):
    response = client.get(
        "/api/v1/rates/history?from=USD&to=ZAR&start_date=2025-06-01&end_date=2025-06-17"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["base"] == "USD"
    assert "2025-06-01" in data["rates"]
