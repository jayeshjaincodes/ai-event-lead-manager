import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Index,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FollowUpStatus(str, enum.Enum):
    """
    Controlled set of follow-up statuses for event leads.
    Enforced at both the Python type system and PostgreSQL database levels.
    """
    NOT_CONTACTED = "Not Contacted"
    FOLLOW_UP = "Follow Up"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    CONVERTED = "Converted"
    NOT_INTERESTED = "Not Interested"


class Lead(Base):
    """
    SQLAlchemy 2.0 ORM model representing business event leads.
    """
    __tablename__ = "leads"

    # UUID primary key generated both client-side and server-side via gen_random_uuid()
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    company: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    event: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    follow_up_status: Mapped[FollowUpStatus] = mapped_column(
        Enum(
            FollowUpStatus,
            name="follow_up_status_enum",
            values_callable=lambda x: [e.value for e in x],
            validate_strings=True,
        ),
        nullable=False,
        default=FollowUpStatus.NOT_CONTACTED,
        server_default=text(f"'{FollowUpStatus.NOT_CONTACTED.value}'"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        # 1. Status filter index: Accelerates status-based filtering
        Index("ix_leads_follow_up_status", "follow_up_status"),
        
        # 2. Chronological ordering index: Speeds up recent lead sorting
        Index("ix_leads_created_at", "created_at"),
        
        # 3. Composite index: Optimizes the primary dashboard query (filter by status + order by created_at DESC)
        Index("ix_leads_status_created_at", "follow_up_status", "created_at"),
        
        # 4. Search & lookup indexes: Fast B-Tree indexing on frequently queried text fields
        Index("ix_leads_name", "name"),
        Index("ix_leads_company", "company"),
        Index("ix_leads_email", "email"),
        Index("ix_leads_event", "event"),
        
        # Check constraint as an additional guarantee against arbitrary status values
        CheckConstraint(
            "follow_up_status IN ('Not Contacted', 'Follow Up', 'Contacted', 'Qualified', 'Converted', 'Not Interested')",
            name="ck_leads_follow_up_status",
        ),
    )

    def __repr__(self) -> str:
        return f"<Lead id={self.id} name='{self.name}' company='{self.company}' status='{self.follow_up_status.value}'>"
