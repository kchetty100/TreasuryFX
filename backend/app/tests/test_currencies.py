def test_list_currencies(client):
    response = client.get("/api/v1/currencies")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert "USD" in data["currencies"]


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "FXPilot"
