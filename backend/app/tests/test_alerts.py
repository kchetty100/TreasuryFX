def test_alerts_crud(client):
    create_response = client.post(
        "/api/v1/alerts",
        json={
            "base_currency": "USD",
            "target_currency": "ZAR",
            "threshold": 20.0,
            "direction": "above",
        },
    )
    assert create_response.status_code == 201
    alert_id = create_response.json()["id"]

    list_response = client.get("/api/v1/alerts")
    assert list_response.status_code == 200
    assert list_response.json()["count"] == 1

    delete_response = client.delete(f"/api/v1/alerts/{alert_id}")
    assert delete_response.status_code == 204


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["database"] is True
