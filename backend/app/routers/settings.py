import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user_id

router = APIRouter(prefix="/settings", tags=["settings"])


def get_or_create_settings(db: Session, user_id: uuid.UUID) -> models.UserSettings:
    """Fetch the user's settings row, creating a default one on first access."""
    settings_row = db.execute(
        select(models.UserSettings).where(models.UserSettings.user_id == user_id)
    ).scalar_one_or_none()

    if settings_row is None:
        settings_row = models.UserSettings(
            user_id=user_id,
            theme="light",
            enable_reminders=True,
            highlight_overdue=True,
            sound_on=True,
            daily_goal=5,
        )
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)

    return settings_row


@router.get("", response_model=schemas.SettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return get_or_create_settings(db, user_id)


@router.put("", response_model=schemas.SettingsOut)
def update_settings(
    payload: schemas.SettingsUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    settings_row = get_or_create_settings(db, user_id)
    data = payload.model_dump(exclude_unset=True)

    for field, value in data.items():
        setattr(settings_row, field, value)

    db.commit()
    db.refresh(settings_row)
    return settings_row
