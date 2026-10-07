import uuid
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient

from app.services.ai import AIService, ai_service


@pytest.mark.asyncio
async def test_successful_summary(client: AsyncClient):
    """1. Successful AI summary generation returning 200 OK and expected structure."""
    # Create a lead with notes
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Sarah Connor",
            "company": "Cyberdyne",
            "email": "sarah@cyberdyne.com",
            "event": "AI Summit",
            "notes": "Discussed neural network automation. Interested in enterprise pilot next quarter.",
            "follow_up_status": "Qualified",
        },
    )
    assert lead_res.status_code == 201
    lead_id = lead_res.json()["id"]

    mock_summary = "Client is interested in enterprise neural network automation pilot starting next quarter."
    with patch.object(ai_service, "summarize_notes", new_callable=AsyncMock) as mock_sum:
        mock_sum.return_value = mock_summary

        res = await client.post(f"/api/v1/leads/{lead_id}/summarize")
        assert res.status_code == 200
        data = res.json()
        assert data["lead_id"] == lead_id
        assert data["summary"] == mock_summary
        mock_sum.assert_awaited_once_with(
            notes="Discussed neural network automation. Interested in enterprise pilot next quarter."
        )


@pytest.mark.asyncio
async def test_successful_follow_up_draft(client: AsyncClient):
    """2. Successful follow-up draft returning 200 OK and personalized content."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "David Miller",
            "company": "Miller Labs",
            "email": "david@millerlabs.io",
            "event": "BioTech World",
            "notes": "Requested a follow-up call next Tuesday.",
            "follow_up_status": "Follow Up",
        },
    )
    lead_id = lead_res.json()["id"]

    mock_draft = "Hi David, it was great speaking with you at BioTech World. I would love to connect next Tuesday for our scheduled discussion."
    with patch.object(ai_service, "draft_follow_up", new_callable=AsyncMock) as mock_draft_fn:
        mock_draft_fn.return_value = mock_draft

        res = await client.post(f"/api/v1/leads/{lead_id}/follow-up")
        assert res.status_code == 200
        data = res.json()
        assert data["lead_id"] == lead_id
        assert data["message"] == mock_draft


@pytest.mark.asyncio
async def test_follow_up_uses_lead_context(client: AsyncClient):
    """8. Follow-up generation receives full lead context (name, company, event, status, notes)."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Elena Rostova",
            "company": "AeroSpace Dynamics",
            "email": "elena@aerospace.org",
            "event": "Global Space Symposium",
            "notes": "Interested in telemetry processing.",
            "follow_up_status": "Qualified",
        },
    )
    lead_id = lead_res.json()["id"]

    with patch.object(ai_service, "draft_follow_up", new_callable=AsyncMock) as mock_draft_fn:
        mock_draft_fn.return_value = "Custom personalized draft"

        res = await client.post(f"/api/v1/leads/{lead_id}/follow-up")
        assert res.status_code == 200
        mock_draft_fn.assert_awaited_once_with(
            name="Elena Rostova",
            company="AeroSpace Dynamics",
            event="Global Space Symposium",
            notes="Interested in telemetry processing.",
            follow_up_status="Qualified",
        )


@pytest.mark.asyncio
async def test_lead_not_found(client: AsyncClient):
    """3. Non-existent lead returns 404 Not Found for both summarize and follow-up."""
    missing_id = str(uuid.uuid4())

    res_sum = await client.post(f"/api/v1/leads/{missing_id}/summarize")
    assert res_sum.status_code == 404
    assert "not found" in res_sum.json()["detail"].lower()

    res_fu = await client.post(f"/api/v1/leads/{missing_id}/follow-up")
    assert res_fu.status_code == 404
    assert "not found" in res_fu.json()["detail"].lower()


@pytest.mark.asyncio
async def test_empty_notes_for_summary(client: AsyncClient):
    """4. Lead with empty or whitespace-only notes returns 400 Bad Request."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "No Notes Lead",
            "company": "Empty Co",
            "email": "empty@notes.com",
            "event": "Expo",
            "notes": "",
        },
    )
    lead_id = lead_res.json()["id"]

    res = await client.post(f"/api/v1/leads/{lead_id}/summarize")
    assert res.status_code == 400
    detail = res.json()["detail"].lower()
    assert "notes" in detail and "empty" in detail


@pytest.mark.asyncio
async def test_missing_gemini_api_key(client: AsyncClient):
    """5. Missing Gemini API key returns 503 Service Unavailable."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Key Test",
            "company": "Key Co",
            "email": "key@test.com",
            "event": "Summit",
            "notes": "Some notes here.",
        },
    )
    lead_id = lead_res.json()["id"]

    with patch.object(ai_service, "summarize_notes", side_effect=HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Gemini AI service is not configured. Missing GEMINI_API_KEY.",
    )):
        res = await client.post(f"/api/v1/leads/{lead_id}/summarize")
        assert res.status_code == 503
        assert "missing gemini_api_key" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_gemini_api_failure(client: AsyncClient):
    """6. Upstream Gemini API error returns 502 Bad Gateway."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Fail Test",
            "company": "Fail Co",
            "email": "fail@test.com",
            "event": "Summit",
            "notes": "Some notes.",
        },
    )
    lead_id = lead_res.json()["id"]

    with patch.object(ai_service, "summarize_notes", side_effect=HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="AI service provider encountered an error.",
    )):
        res = await client.post(f"/api/v1/leads/{lead_id}/summarize")
        assert res.status_code == 502
        assert "error" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_empty_ai_response(client: AsyncClient):
    """7. Empty response returned by model yields 502 Bad Gateway."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Empty Response Test",
            "company": "Co",
            "email": "empty@resp.com",
            "event": "Summit",
            "notes": "Valid notes here.",
        },
    )
    lead_id = lead_res.json()["id"]

    with patch.object(ai_service, "summarize_notes", side_effect=HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="AI service returned an empty summary.",
    )):
        res = await client.post(f"/api/v1/leads/{lead_id}/summarize")
        assert res.status_code == 502
        assert "empty" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_api_key_never_included_in_responses(client: AsyncClient):
    """9. API key is never exposed or leaked in response headers or payload."""
    lead_res = await client.post(
        "/api/v1/leads",
        json={
            "name": "Security Test",
            "company": "Secure Inc",
            "email": "sec@secure.com",
            "event": "CyberSec",
            "notes": "Testing secret leakage.",
        },
    )
    lead_id = lead_res.json()["id"]

    with patch.object(ai_service, "summarize_notes", return_value="Secure summary result"):
        res = await client.post(f"/api/v1/leads/{lead_id}/summarize")
        assert res.status_code == 200
        # Ensure GEMINI_API_KEY or key identifier is absent
        assert "api_key" not in res.text.lower()
        assert "gemini_api_key" not in res.text.lower()
        for header, val in res.headers.items():
            assert "key" not in header.lower() or "cache" in header.lower()
