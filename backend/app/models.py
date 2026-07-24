import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, SmallInteger, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Task(Base):
    """Mirrors public.tasks in supabase/schema.sql."""

    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("priority in ('low', 'medium', 'high')", name="tasks_priority_check"),
        CheckConstraint("status in ('todo', 'doing', 'done')", name="tasks_status_check"),
        CheckConstraint(
            "category in ('learning', 'work', 'ai', 'rocket', 'personal')",
            name="tasks_category_check",
        ),
        CheckConstraint(
            "progress is null or (progress >= 0 and progress <= 100)",
            name="tasks_progress_check",
        ),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String, nullable=False, server_default="medium")
    status: Mapped[str] = mapped_column(String, nullable=False, server_default="todo")
    category: Mapped[str] = mapped_column(String, nullable=False, server_default="work")
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )


class UserSettings(Base):
    """Mirrors public.user_settings in supabase/schema.sql."""

    __tablename__ = "user_settings"
    __table_args__ = (
        CheckConstraint("theme in ('light', 'dark')", name="user_settings_theme_check"),
        CheckConstraint("daily_goal > 0", name="user_settings_daily_goal_check"),
        {"schema": "public"},
    )

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    theme: Mapped[str] = mapped_column(String, nullable=False, server_default="light")
    enable_reminders: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    highlight_overdue: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    sound_on: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    daily_goal: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("5"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )


class ActivityLog(Base):
    """Mirrors public.activity_log in supabase/schema.sql."""

    __tablename__ = "activity_log"
    __table_args__ = (
        CheckConstraint(
            "action in ('created', 'moved', 'completed', 'reopened', 'updated', 'deleted')",
            name="activity_log_action_check",
        ),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    task_title: Mapped[str] = mapped_column(Text, nullable=False)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
