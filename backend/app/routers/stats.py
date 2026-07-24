import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user_id

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/board", response_model=schemas.StatsBoardOut)
def get_board_stats(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    now = datetime.now(timezone.utc)

    row = db.execute(
        select(
            func.count().label("total_tasks"),
            func.count().filter(models.Task.status == "todo").label("todo"),
            func.count().filter(models.Task.status == "doing").label("doing"),
            func.count().filter(models.Task.status == "done").label("done"),
            func.count()
            .filter(
                models.Task.status != "done",
                models.Task.due_at.isnot(None),
                models.Task.due_at < now,
            )
            .label("overdue"),
        ).where(models.Task.user_id == user_id)
    ).one()

    return schemas.StatsBoardOut(
        total_tasks=row.total_tasks,
        todo=row.todo,
        doing=row.doing,
        done=row.done,
        overdue=row.overdue,
    )


@router.get("/history", response_model=schemas.StatsHistoryOut)
def get_history_stats(
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now - timedelta(days=30)
    window_start = now - timedelta(days=56)  # 8 weeks

    total_completed = db.execute(
        select(func.count())
        .select_from(models.Task)
        .where(models.Task.user_id == user_id, models.Task.status == "done")
    ).scalar_one()

    completed_this_month = db.execute(
        select(func.count())
        .select_from(models.Task)
        .where(
            models.Task.user_id == user_id,
            models.Task.status == "done",
            models.Task.completed_at >= month_start,
        )
    ).scalar_one()

    completed_today = db.execute(
        select(func.count())
        .select_from(models.Task)
        .where(
            models.Task.user_id == user_id,
            models.Task.status == "done",
            models.Task.completed_at >= today_start,
        )
    ).scalar_one()

    # Build 8 weekly buckets, oldest -> newest, ending at "now". Bucket[7] (the
    # newest) covers the last 7 days, i.e. exactly "completed_this_week".
    # Bucket[6] covers the preceding 7-day window, used for the week-over-week delta.
    completed_ats = (
        db.execute(
            select(models.Task.completed_at).where(
                models.Task.user_id == user_id,
                models.Task.status == "done",
                models.Task.completed_at >= window_start,
                models.Task.completed_at <= now,
            )
        )
        .scalars()
        .all()
    )

    buckets = [0] * 8
    for completed_at in completed_ats:
        if completed_at is None:
            continue
        age_days = (now - completed_at).total_seconds() / 86400
        weeks_ago = int(age_days // 7)
        if 0 <= weeks_ago < 8:
            buckets[7 - weeks_ago] += 1

    completed_this_week = buckets[7]
    completed_this_week_delta = buckets[7] - buckets[6]

    daily_goal = db.execute(
        select(models.UserSettings.daily_goal).where(models.UserSettings.user_id == user_id)
    ).scalar_one_or_none()
    if not daily_goal:
        daily_goal = 5

    daily_goal_percent = min(100, round(completed_today / daily_goal * 100))

    return schemas.StatsHistoryOut(
        completed_this_week=completed_this_week,
        completed_this_week_delta=completed_this_week_delta,
        completed_this_month=completed_this_month,
        completed_last_8_weeks=buckets,
        total_completed=total_completed,
        daily_goal_percent=daily_goal_percent,
    )
