def test_watchlist_crud(client):
    create_response = client.post(
        "/api/v1/watchlist",
        json={"base_currency": "USD", "target_currency": "EUR"},
    )
    assert create_response.status_code == 201
    item_id = create_response.json()["id"]

    list_response = client.get("/api/v1/watchlist")
    assert list_response.status_code == 200
    assert list_response.json()["count"] == 1

    delete_response = client.delete(f"/api/v1/watchlist/{item_id}")
    assert delete_response.status_code == 204

    list_after = client.get("/api/v1/watchlist")
    assert list_after.json()["count"] == 0


def test_watchlist_duplicate(client):
    payload = {"base_currency": "USD", "target_currency": "GBP"}
    client.post("/api/v1/watchlist", json=payload)
    response = client.post("/api/v1/watchlist", json=payload)
    assert response.status_code == 409
