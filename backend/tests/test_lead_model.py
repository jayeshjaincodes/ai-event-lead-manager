import pytest
import uuid
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import FollowUpStatus, Lead


@pytest.mark.asyncio
async def test_create_lead_model(db_session: AsyncSession):
    """
    Verifies that the Lead model can be instantiated and persisted
    with UUID primary key, controlled follow_up_status, and timestamps.
    """
    lead = Lead(
        name="Sarah Connor",
        company="Cyberdyne Systems",
        email="sarah@example.com",
        event="Tech Summit 2026",
        notes="Interested in enterprise AI workflow automation.",
        follow_up_status=FollowUpStatus.NOT_CONTACTED,
    )

    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    assert isinstance(lead.id, uuid.UUID)
    assert lead.name == "Sarah Connor"
    assert lead.company == "Cyberdyne Systems"
    assert lead.email == "sarah@example.com"
    assert lead.event == "Tech Summit 2026"
    assert lead.follow_up_status == FollowUpStatus.NOT_CONTACTED
    assert isinstance(lead.created_at, datetime)
    assert isinstance(lead.updated_at, datetime)


@pytest.mark.asyncio
async def test_query_lead_by_status(db_session: AsyncSession):
    """
    Verifies querying leads by follow-up status.
    """
    lead1 = Lead(
        name="Alice Smith",
        company="Acme Corp",
        email="alice@acme.com",
        event="SaaS Expo",
        notes="Met at booth. Requested demo.",
        follow_up_status=FollowUpStatus.FOLLOW_UP,
    )
    lead2 = Lead(
        name="Bob Jones",
        company="Beta LLC",
        email="bob@beta.com",
        event="SaaS Expo",
        notes="General inquiry.",
        follow_up_status=FollowUpStatus.QUALIFIED,
    )

    db_session.add_all([lead1, lead2])
    await db_session.commit()

    query = select(Lead).where(Lead.follow_up_status == FollowUpStatus.FOLLOW_UP)
    result = await db_session.execute(query)
    leads = result.scalars().all()

    assert len(leads) == 1
    assert leads[0].name == "Alice Smith"
