import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoints(client: AsyncClient):
    """Verifies that the /health and /api/v1/health endpoints return 200 OK."""
    r_root = await client.get("/health")
    assert r_root.status_code == 200
    assert r_root.json()["status"] == "ok"

    r_api = await client.get("/api/v1/health")
    assert r_api.status_code == 200
    assert r_api.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_lead(client: AsyncClient):
    """1. Create lead successfully with 201 Created."""
    payload = {
        "name": "Jane Doe",
        "company": "Tech Corp",
        "email": "jane@techcorp.com",
        "event": "AI World 2026",
        "notes": "Discussed pilot integration.",
        "follow_up_status": "Contacted",
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["company"] == "Tech Corp"
    assert data["email"] == "jane@techcorp.com"
    assert data["event"] == "AI World 2026"
    assert data["notes"] == "Discussed pilot integration."
    assert data["follow_up_status"] == "Contacted"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_default_status_is_not_contacted(client: AsyncClient):
    """18. Default status is 'Not Contacted' when follow_up_status is omitted."""
    payload = {
        "name": "John Smith",
        "company": "Acme Inc",
        "email": "john@acme.com",
        "event": "Cloud Expo",
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["follow_up_status"] == "Not Contacted"
    assert data["notes"] == ""


@pytest.mark.asyncio
async def test_get_lead(client: AsyncClient):
    """2. Get a single lead by UUID with 200 OK."""
    # First create
    create_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Alice Wonderland",
            "company": "Wonder LLC",
            "email": "alice@wonder.com",
            "event": "DevConf",
        },
    )
    lead_id = create_res.json()["id"]

    # Now get
    get_res = await client.get(f"/api/v1/leads/{lead_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == lead_id
    assert data["name"] == "Alice Wonderland"


@pytest.mark.asyncio
async def test_missing_lead_returns_404(client: AsyncClient):
    """15. Missing lead returns 404 Not Found."""
    non_existent_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/leads/{non_existent_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_leads(client: AsyncClient):
    """3. List leads returns paginated result structure."""
    # Create two leads
    await client.post(
        "/api/v1/leads",
        json={
            "name": "Lead One",
            "company": "Company A",
            "email": "one@companya.com",
            "event": "Event 1",
        },
    )
    await client.post(
        "/api/v1/leads",
        json={
            "name": "Lead Two",
            "company": "Company B",
            "email": "two@companyb.com",
            "event": "Event 2",
        },
    )

    response = await client.get("/api/v1/leads")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total" in data
    assert "total_pages" in data
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_update_lead(client: AsyncClient):
    """4. Update lead using PATCH returns 200 OK."""
    create_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Robert Brown",
            "company": "Brown Ind",
            "email": "robert@brown.com",
            "event": "Summit",
            "follow_up_status": "Not Contacted",
        },
    )
    lead_id = create_res.json()["id"]

    patch_res = await client.patch(
        f"/api/v1/leads/{lead_id}",
        json={
            "company": "Brown Enterprises",
            "follow_up_status": "Qualified",
        },
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["company"] == "Brown Enterprises"
    assert data["follow_up_status"] == "Qualified"
    assert data["name"] == "Robert Brown"  # Unmodified


@pytest.mark.asyncio
async def test_patch_updates_only_supplied_fields(client: AsyncClient):
    """17. PATCH updates only supplied fields and preserves untouched fields."""
    create_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Original Name",
            "company": "Original Co",
            "email": "orig@co.com",
            "event": "Original Event",
            "notes": "Original notes preserved",
            "follow_up_status": "Follow Up",
        },
    )
    lead_id = create_res.json()["id"]

    patch_res = await client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"notes": "Updated notes only"},
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["notes"] == "Updated notes only"
    assert data["name"] == "Original Name"
    assert data["company"] == "Original Co"
    assert data["email"] == "orig@co.com"
    assert data["event"] == "Original Event"
    assert data["follow_up_status"] == "Follow Up"


@pytest.mark.asyncio
async def test_delete_lead(client: AsyncClient):
    """5. Delete lead returns 204 No Content and removes resource."""
    create_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "ToDelete",
            "company": "Del Co",
            "email": "del@del.com",
            "event": "Del Event",
        },
    )
    lead_id = create_res.json()["id"]

    del_res = await client.delete(f"/api/v1/leads/{lead_id}")
    assert del_res.status_code == 204

    # Subsequent GET returns 404
    get_res = await client.get(f"/api/v1/leads/{lead_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_delete_missing_lead_returns_404(client: AsyncClient):
    """16. Delete missing lead returns 404 Not Found."""
    non_existent_id = str(uuid.uuid4())
    del_res = await client.delete(f"/api/v1/leads/{non_existent_id}")
    assert del_res.status_code == 404


@pytest.mark.asyncio
async def test_search_by_name(client: AsyncClient):
    """6. Search case-insensitively by name."""
    await client.post(
        "/api/v1/leads",
        json={"name": "Alexander Hamilton", "company": "Treasury", "email": "alex@treasury.gov", "event": "Convention"},
    )
    await client.post(
        "/api/v1/leads",
        json={"name": "George Washington", "company": "Army", "email": "george@army.mil", "event": "Convention"},
    )

    res = await client.get("/api/v1/leads?search=alex")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Alexander Hamilton"


@pytest.mark.asyncio
async def test_search_by_company(client: AsyncClient):
    """7. Search case-insensitively by company."""
    await client.post(
        "/api/v1/leads",
        json={"name": "Satya Nadella", "company": "Microsoft Cloud", "email": "satya@msft.com", "event": "Ignite"},
    )
    await client.post(
        "/api/v1/leads",
        json={"name": "Sundar Pichai", "company": "Alphabet Inc", "email": "sundar@google.com", "event": "IO"},
    )

    res = await client.get("/api/v1/leads?search=microsoft")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["company"] == "Microsoft Cloud"


@pytest.mark.asyncio
async def test_search_by_email(client: AsyncClient):
    """8. Search case-insensitively by email."""
    await client.post(
        "/api/v1/leads",
        json={"name": "Sam Altman", "company": "OpenAI", "email": "sam@openai.com", "event": "DevDay"},
    )

    res = await client.get("/api/v1/leads?search=sam@openai")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["email"] == "sam@openai.com"


@pytest.mark.asyncio
async def test_search_by_event(client: AsyncClient):
    """9. Search case-insensitively by event."""
    await client.post(
        "/api/v1/leads",
        json={"name": "Attendee 1", "company": "Co 1", "email": "att1@co.com", "event": "Web3 Summit Tokyo"},
    )
    await client.post(
        "/api/v1/leads",
        json={"name": "Attendee 2", "company": "Co 2", "email": "att2@co.com", "event": "FinTech London"},
    )

    res = await client.get("/api/v1/leads?search=tokyo")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["event"] == "Web3 Summit Tokyo"


@pytest.mark.asyncio
async def test_filter_by_follow_up_status(client: AsyncClient):
    """10. Filter leads by follow_up_status."""
    await client.post(
        "/api/v1/leads",
        json={"name": "Status A", "company": "Co A", "email": "a@co.com", "event": "Ev", "follow_up_status": "Qualified"},
    )
    await client.post(
        "/api/v1/leads",
        json={"name": "Status B", "company": "Co B", "email": "b@co.com", "event": "Ev", "follow_up_status": "Converted"},
    )

    res = await client.get("/api/v1/leads?follow_up_status=Qualified")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["follow_up_status"] == "Qualified"


@pytest.mark.asyncio
async def test_search_and_filter_together(client: AsyncClient):
    """11. Search + filter combined together."""
    await client.post(
        "/api/v1/leads",
        json={"name": "Target Lead", "company": "Google Corp", "email": "target@google.com", "event": "Nexus", "follow_up_status": "Qualified"},
    )
    await client.post(
        "/api/v1/leads",
        json={"name": "Other Lead", "company": "Google Corp", "email": "other@google.com", "event": "Nexus", "follow_up_status": "Not Contacted"},
    )
    await client.post(
        "/api/v1/leads",
        json={"name": "Target Lead 2", "company": "Amazon Corp", "email": "target2@amazon.com", "event": "Nexus", "follow_up_status": "Qualified"},
    )

    # Search Google and filter Qualified
    res = await client.get("/api/v1/leads?search=google&follow_up_status=Qualified")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Target Lead"
    assert items[0]["company"] == "Google Corp"
    assert items[0]["follow_up_status"] == "Qualified"


@pytest.mark.asyncio
async def test_pagination(client: AsyncClient):
    """12. Pagination page and page_size controls."""
    for i in range(15):
        await client.post(
            "/api/v1/leads",
            json={"name": f"Person {i:02d}", "company": "Paged Corp", "email": f"p{i}@paged.com", "event": "Expo"},
        )

    res_page1 = await client.get("/api/v1/leads?page=1&page_size=5")
    assert res_page1.status_code == 200
    data1 = res_page1.json()
    assert data1["page"] == 1
    assert data1["page_size"] == 5
    assert data1["total"] == 15
    assert data1["total_pages"] == 3
    assert len(data1["items"]) == 5

    res_page2 = await client.get("/api/v1/leads?page=2&page_size=5")
    assert res_page2.status_code == 200
    data2 = res_page2.json()
    assert data2["page"] == 2
    assert len(data2["items"]) == 5

    # Ensure page 1 and page 2 items are distinct
    p1_ids = {item["id"] for item in data1["items"]}
    p2_ids = {item["id"] for item in data2["items"]}
    assert p1_ids.isdisjoint(p2_ids)


@pytest.mark.asyncio
async def test_invalid_email_validation(client: AsyncClient):
    """13. Invalid email rejected with 422 Unprocessable Entity."""
    payload = {
        "name": "Bad Email",
        "company": "Bad Co",
        "email": "not-an-email",
        "event": "Event",
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invalid_follow_up_status(client: AsyncClient):
    """14. Invalid follow_up_status rejected with 422 Unprocessable Entity."""
    payload = {
        "name": "Invalid Status",
        "company": "Bad Co",
        "email": "test@valid.com",
        "event": "Event",
        "follow_up_status": "NonExistentStatus",
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_empty_string_validation(client: AsyncClient):
    """Ensures empty or whitespace strings are rejected with 422."""
    payload = {
        "name": "   ",
        "company": "Valid Co",
        "email": "test@valid.com",
        "event": "Valid Event",
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 422
