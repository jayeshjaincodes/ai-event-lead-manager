import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.lead import FollowUpStatus


class LeadBase(BaseModel):
    """Base lead fields shared across creation and representation."""
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the contact")
    company: str = Field(..., min_length=1, max_length=255, description="Company or organization name")
    email: EmailStr = Field(..., max_length=255, description="Valid email address")
    event: str = Field(..., min_length=1, max_length=255, description="Event or conference name")
    notes: Optional[str] = Field(default="", description="Detailed meeting or conversation notes")
    follow_up_status: Optional[FollowUpStatus] = Field(
        default=FollowUpStatus.NOT_CONTACTED,
        description="Current sales pipeline follow-up status",
    )

    @field_validator("name", "company", "event", mode="before")
    @classmethod
    def strip_and_validate_non_empty(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or contain only whitespace.")
        return v


class LeadCreate(LeadBase):
    """
    Schema for creating a new lead.
    Enforces non-empty fields, valid email, and defaults follow-up status to 'Not Contacted'.
    Explicitly does NOT accept id, created_at, or updated_at from the client.
    """
    pass


class LeadUpdate(BaseModel):
    """
    Schema for updating an existing lead via PATCH.
    All fields are optional to support partial updates.
    """
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    company: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    event: Optional[str] = Field(default=None, min_length=1, max_length=255)
    notes: Optional[str] = Field(default=None)
    follow_up_status: Optional[FollowUpStatus] = Field(default=None)

    @field_validator("name", "company", "event", mode="before")
    @classmethod
    def strip_and_validate_optional_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or contain only whitespace.")
        return v


class LeadResponse(BaseModel):
    """
    Schema returned for a single lead.
    Supports ORM attribute loading from SQLAlchemy model instances.
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    company: str
    email: str
    event: str
    notes: str
    follow_up_status: FollowUpStatus
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    """
    Paginated list response containing lead items and metadata.
    """
    items: List[LeadResponse]
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of items per page")
    total: int = Field(..., ge=0, description="Total number of matching leads")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
