import uuid
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user_id

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/recent", response_model=List[schemas.ActivityOut])
def get_recent_activity(
    limit: int = Query(default=10, ge=1, le=200),
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    stmt = (
        select(models.ActivityLog)
        .where(models.ActivityLog.user_id == user_id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()
