import math
import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import FollowUpStatus, Lead


class LeadRepository:
    """
    Handles all database persistence and querying for the Lead model using SQLAlchemy 2.0.
    """

    async def create(self, db: AsyncSession, lead: Lead) -> Lead:
        """Persists a new lead in the database."""
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
        return lead

    async def get_by_id(self, db: AsyncSession, lead_id: uuid.UUID) -> Optional[Lead]:
        """Fetches a single lead by its UUID primary key."""
        stmt = select(Lead).where(Lead.id == lead_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        db: AsyncSession,
        search: Optional[str] = None,
        follow_up_status: Optional[FollowUpStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Lead], int]:
        """
        Queries leads with database-side filtering, case-insensitive search,
        created_at descending ordering, and pagination.
        """
        filters = []

        # Case-insensitive search across name, company, email, and event
        if search and search.strip():
            term = search.strip()
            # Escape % and _ for safe LIKE pattern matching
            escaped_term = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped_term}%"
            filters.append(
                or_(
                    Lead.name.ilike(pattern),
                    Lead.company.ilike(pattern),
                    Lead.email.ilike(pattern),
                    Lead.event.ilike(pattern),
                )
            )

        # Status filter
        if follow_up_status is not None:
            filters.append(Lead.follow_up_status == follow_up_status)

        # 1. Database-side total count query
        count_stmt = select(func.count(Lead.id))
        if filters:
            count_stmt = count_stmt.where(*filters)
        total_result = await db.execute(count_stmt)
        total: int = total_result.scalar_one()

        # 2. Database-side paginated items query with created_at descending sort
        offset = (page - 1) * page_size
        items_stmt = select(Lead)
        if filters:
            items_stmt = items_stmt.where(*filters)
        items_stmt = items_stmt.order_by(Lead.created_at.desc()).offset(offset).limit(page_size)

        items_result = await db.execute(items_stmt)
        items = list(items_result.scalars().all())

        return items, total

    async def update(self, db: AsyncSession, lead: Lead, update_data: dict) -> Lead:
        """Applies partial updates to a lead entity."""
        for key, value in update_data.items():
            setattr(lead, key, value)
        await db.commit()
        await db.refresh(lead)
        return lead

    async def delete(self, db: AsyncSession, lead: Lead) -> None:
        """Deletes a lead entity from the database."""
        await db.delete(lead)
        await db.commit()


lead_repository = LeadRepository()
