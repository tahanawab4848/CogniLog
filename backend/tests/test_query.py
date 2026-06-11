import pytest

def get_auth_headers(client, email="query@example.com", password="password"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Query User"}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_ask_historian_and_predictions(client):
    headers = get_auth_headers(client)
    
    # 1. Create project
    proj_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "CampusVerse Simulator", "description": "3D simulator project"}
    )
    proj_id = proj_res.json()["id"]

    # 2. Upload file to create documents/embeddings fallback
    file_content = b"CampusVerse is built on Unity WebGL. We migrated from Unreal Engine to Unity."
    client.post(
        f"/api/v1/projects/{proj_id}/documents",
        headers=headers,
        files={"file": ("campusverse_notes.txt", file_content, "text/plain")}
    )

    # 3. Ask Historian
    ask_res = client.post(
        f"/api/v1/projects/{proj_id}/ask",
        headers=headers,
        json={"query": "Why did we switch to Unity?"}
    )
    assert ask_res.status_code == 200
    ask_data = ask_res.json()
    assert "answer" in ask_data
    assert len(ask_data["sources"]) > 0

    # 4. Predictions
    pred_res = client.get(
        f"/api/v1/projects/{proj_id}/predict",
        headers=headers
      )
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert "blockers" in pred_data
    assert "next_tasks" in pred_data
    assert len(pred_data["blockers"]) > 0

    # 5. Semantic Search
    search_res = client.get(
        f"/api/v1/projects/{proj_id}/search?q=Unity",
        headers=headers
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data) > 0
    assert "content" in search_data[0]
