import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import FollowUpStatus
from app.schemas.ai import AIFollowUpResponse, AISummaryResponse
from app.schemas.lead import (
    LeadCreate,
    LeadListResponse,
    LeadResponse,
    LeadUpdate,
)
from app.services.ai import AIService, ai_service
from app.services.lead import LeadService, lead_service

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.get(
    "",
    response_model=LeadListResponse,
    summary="List leads with search, filter, and pagination",
    status_code=status.HTTP_200_OK,
)
async def list_leads(
    search: Optional[str] = Query(
        default=None,
        description="Case-insensitive search matching name, company, email, or event",
    ),
    follow_up_status: Optional[FollowUpStatus] = Query(
        default=None,
        description="Filter leads by specific follow-up pipeline status",
    ),
    page: int = Query(
        default=1,
        ge=1,
        description="Page number (starting at 1)",
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of items per page (maximum 100)",
    ),
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
) -> LeadListResponse:
    """
    Retrieves a paginated list of leads sorted chronologically descending.
    Supports case-insensitive search and status filtering in combination.
    """
    return await service.list_leads(
        db=db,
        search=search,
        follow_up_status=follow_up_status,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event lead",
)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
) -> LeadResponse:
    """
    Creates a new lead with server-generated UUID and timestamps.
    Follow-up status defaults to 'Not Contacted'.
    """
    lead = await service.create_lead(db=db, lead_in=lead_in)
    return LeadResponse.model_validate(lead)


@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a lead by UUID",
)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
) -> LeadResponse:
    """
    Retrieves details for a single lead by its UUID identifier.
    Returns 404 if not found.
    """
    lead = await service.get_lead(db=db, lead_id=lead_id)
    return LeadResponse.model_validate(lead)


@router.patch(
    "/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially update a lead",
)
async def update_lead(
    lead_id: uuid.UUID,
    lead_in: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
) -> LeadResponse:
    """
    Updates one or more fields on an existing lead.
    Returns 404 if the lead does not exist.
    """
    updated_lead = await service.update_lead(
        db=db,
        lead_id=lead_id,
        lead_in=lead_in,
    )
    return LeadResponse.model_validate(updated_lead)


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a lead",
)
async def delete_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
) -> Response:
    """
    Deletes a lead by its UUID identifier.
    Returns 204 No Content on success, or 404 if not found.
    """
    await service.delete_lead(db=db, lead_id=lead_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{lead_id}/summarize",
    response_model=AISummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate concise AI summary of lead interaction notes",
)
async def summarize_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
    ai_svc: AIService = Depends(lambda: ai_service),
) -> AISummaryResponse:
    """
    Produces a concise, factual 2-3 sentence summary of the lead's notes using Google Gemini.
    Returns 400 if notes are empty, or 404 if the lead does not exist.
    """
    return await service.summarize_lead_notes(
        db=db,
        lead_id=lead_id,
        ai_svc=ai_svc,
    )


@router.post(
    "/{lead_id}/follow-up",
    response_model=AIFollowUpResponse,
    status_code=status.HTTP_200_OK,
    summary="Draft professional AI follow-up message tailored to lead",
)
async def draft_follow_up(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: LeadService = Depends(lambda: lead_service),
    ai_svc: AIService = Depends(lambda: ai_service),
) -> AIFollowUpResponse:
    """
    Generates a personalized, professional follow-up message using Google Gemini
    based on the lead's name, company, event, status, and meeting notes.
    Returns 404 if the lead does not exist.
    """
    return await service.draft_lead_follow_up(
        db=db,
        lead_id=lead_id,
        ai_svc=ai_svc,
    )

