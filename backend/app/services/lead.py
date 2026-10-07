import math
import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import FollowUpStatus, Lead
from app.repositories.lead import LeadRepository, lead_repository
from app.schemas.ai import AIFollowUpResponse, AISummaryResponse
from app.schemas.lead import LeadCreate, LeadListResponse, LeadResponse, LeadUpdate
from app.services.ai import AIService, ai_service


class LeadService:
    """
    Encapsulates business logic, validation rules, and orchestration for leads.
    """

    def __init__(self, repository: LeadRepository = lead_repository):
        self.repository = repository

    async def create_lead(self, db: AsyncSession, lead_in: LeadCreate) -> Lead:
        """
        Creates a new lead from validated input schema.
        Follow-up status defaults to 'Not Contacted'.
        """
        lead = Lead(
            name=lead_in.name,
            company=lead_in.company,
            email=str(lead_in.email),
            event=lead_in.event,
            notes=lead_in.notes or "",
            follow_up_status=lead_in.follow_up_status or FollowUpStatus.NOT_CONTACTED,
        )
        return await self.repository.create(db, lead)

    async def get_lead(self, db: AsyncSession, lead_id: uuid.UUID) -> Lead:
        """
        Retrieves a single lead by ID or raises HTTP 404.
        """
        lead = await self.repository.get_by_id(db, lead_id)
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lead with ID {lead_id} not found",
            )
        return lead

    async def list_leads(
        self,
        db: AsyncSession,
        search: Optional[str] = None,
        follow_up_status: Optional[FollowUpStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> LeadListResponse:
        """
        Retrieves paginated and filtered leads, calculating total pages.
        """
        items, total = await self.repository.list(
            db=db,
            search=search,
            follow_up_status=follow_up_status,
            page=page,
            page_size=page_size,
        )
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        lead_responses = [LeadResponse.model_validate(item) for item in items]

        return LeadListResponse(
            items=lead_responses,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    async def update_lead(
        self,
        db: AsyncSession,
        lead_id: uuid.UUID,
        lead_in: LeadUpdate,
    ) -> Lead:
        """
        Performs partial updates on an existing lead or raises HTTP 404.
        """
        lead = await self.get_lead(db, lead_id)
        update_data = lead_in.model_dump(exclude_unset=True)

        # Convert EmailStr to str if present
        if "email" in update_data and update_data["email"] is not None:
            update_data["email"] = str(update_data["email"])

        if not update_data:
            return lead

        return await self.repository.update(db, lead, update_data)

    async def delete_lead(self, db: AsyncSession, lead_id: uuid.UUID) -> None:
        """
        Deletes a lead by ID or raises HTTP 404.
        """
        lead = await self.get_lead(db, lead_id)
        await self.repository.delete(db, lead)

    async def summarize_lead_notes(
        self,
        db: AsyncSession,
        lead_id: uuid.UUID,
        ai_svc: AIService,
    ) -> AISummaryResponse:
        """
        Fetches lead notes and delegates generation to AIService.
        Returns 400 if notes are empty or 404 if lead does not exist.
        """
        lead = await self.get_lead(db, lead_id)
        if not lead.notes or not lead.notes.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lead notes are empty. Please provide notes to summarize.",
            )

        summary = await ai_svc.summarize_notes(notes=lead.notes)
        return AISummaryResponse(lead_id=lead.id, summary=summary)

    async def draft_lead_follow_up(
        self,
        db: AsyncSession,
        lead_id: uuid.UUID,
        ai_svc: AIService,
    ) -> AIFollowUpResponse:
        """
        Fetches lead details and delegates personalized follow-up message generation to AIService.
        Returns 404 if lead does not exist.
        """
        lead = await self.get_lead(db, lead_id)
        message = await ai_svc.draft_follow_up(
            name=lead.name,
            company=lead.company,
            event=lead.event,
            notes=lead.notes,
            follow_up_status=lead.follow_up_status.value if hasattr(lead.follow_up_status, "value") else str(lead.follow_up_status),
        )
        return AIFollowUpResponse(lead_id=lead.id, message=message)


lead_service = LeadService()
