import pytest

def get_auth_headers(client, email="user@example.com", password="password"):
    # Register and login helper
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Auth User"}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_and_list_projects(client):
    headers = get_auth_headers(client, "create@example.com")
    
    # Create
    response = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Chronicle System", "description": "AI trace timeline database"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Chronicle System"
    assert "id" in data
    
    # List
    response = client.get("/api/v1/projects", headers=headers)
    assert response.status_code == 200
    projects_list = response.json()
    assert len(projects_list) == 1
    assert projects_list[0]["name"] == "Chronicle System"

def test_project_unauthorized(client):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401

def test_upload_and_extract(client):
    headers = get_auth_headers(client, "uploader@example.com")
    
    # Create project
    proj_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "CampusVerse", "description": "Simulator"}
    )
    proj_id = proj_res.json()["id"]

    # Upload document
    file_content = b"=== CONVERSATION ===\n[USER]: Let's switch client to Unity.\n[ASSISTANT]: Good idea because Unreal UE5 WebGL is deprecated."
    
    response = client.post(
        f"/api/v1/projects/{proj_id}/documents",
        headers=headers,
        files={"file": ("chat_log.txt", file_content, "text/plain")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "project_name" in data
    assert len(data["decisions"]) > 0
    
    # Verify graph contains nodes
    graph_res = client.get(f"/api/v1/projects/{proj_id}/graph", headers=headers)
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert "nodes" in graph_data
    assert len(graph_data["nodes"]) > 0
