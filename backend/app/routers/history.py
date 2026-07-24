import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user_id

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[schemas.TaskOut])
def get_history(
    range_: str = Query(default="all", alias="range"),
    category: Optional[schemas.Category] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    now = datetime.now(timezone.utc)
    stmt = select(models.Task).where(
        models.Task.user_id == user_id, models.Task.status == "done"
    )

    if range_ == "today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = stmt.where(models.Task.completed_at >= cutoff)
    elif range_ == "week":
        cutoff = now - timedelta(days=7)
        stmt = stmt.where(models.Task.completed_at >= cutoff)
    elif range_ == "month":
        cutoff = now - timedelta(days=30)
        stmt = stmt.where(models.Task.completed_at >= cutoff)
    # range_ == "all" (or any other value): no cutoff filter applied.

    if category:
        stmt = stmt.where(models.Task.category == category)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(models.Task.title.ilike(like), models.Task.description.ilike(like))
        )

    stmt = stmt.order_by(models.Task.completed_at.desc())
    return db.execute(stmt).scalars().all()
