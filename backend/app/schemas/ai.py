import uuid
from pydantic import BaseModel, Field


class AISummaryResponse(BaseModel):
    """
    Response schema for AI-generated interaction notes summary.
    """
    lead_id: uuid.UUID = Field(..., description="UUID of the summarized lead entity")
    summary: str = Field(..., description="Concise, factual summary of the lead's notes")


class AIFollowUpResponse(BaseModel):
    """
    Response schema for AI-generated follow-up message draft.
    """
    lead_id: uuid.UUID = Field(..., description="UUID of the target lead entity")
    message: str = Field(..., description="Professional, personalized follow-up message draft")
