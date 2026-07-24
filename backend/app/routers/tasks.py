import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_user_id

router = APIRouter(prefix="/tasks", tags=["tasks"])

_STATUS_LABELS = {"todo": "Todo", "doing": "Doing", "done": "Done"}


def _get_owned_task(db: Session, task_id: uuid.UUID, user_id: uuid.UUID) -> models.Task:
    task = db.execute(
        select(models.Task).where(models.Task.id == task_id, models.Task.user_id == user_id)
    ).scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _log_activity(
    db: Session, user_id: uuid.UUID, action: str, task_title: str, detail: Optional[str] = None
) -> None:
    db.add(
        models.ActivityLog(user_id=user_id, action=action, task_title=task_title, detail=detail)
    )


@router.get("", response_model=List[schemas.TaskOut])
def list_tasks(
    status_: Optional[schemas.Status] = Query(default=None, alias="status"),
    category: Optional[schemas.Category] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    stmt = select(models.Task).where(models.Task.user_id == user_id)

    if status_:
        stmt = stmt.where(models.Task.status == status_)
    if category:
        stmt = stmt.where(models.Task.category == category)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(models.Task.title.ilike(like), models.Task.description.ilike(like))
        )

    stmt = stmt.order_by(models.Task.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    task = models.Task(user_id=user_id, **payload.model_dump())
    db.add(task)
    db.flush()

    _log_activity(db, user_id, "created", task.title)

    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return _get_owned_task(db, task_id, user_id)


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: uuid.UUID,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    task = _get_owned_task(db, task_id, user_id)
    data = payload.model_dump(exclude_unset=True)

    previous_status = task.status
    for field, value in data.items():
        setattr(task, field, value)

    # Keep completed_at in sync if this partial update also changes status.
    if "status" in data:
        if data["status"] == "done" and previous_status != "done":
            task.completed_at = datetime.now(timezone.utc)
        elif data["status"] != "done":
            task.completed_at = None

    db.flush()
    _log_activity(db, user_id, "updated", task.title)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: uuid.UUID,
    payload: schemas.TaskStatusUpdate,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    task = _get_owned_task(db, task_id, user_id)
    previous_status = task.status
    new_status = payload.status

    if new_status == "done" and previous_status != "done":
        task.completed_at = datetime.now(timezone.utc)
    elif new_status != "done":
        task.completed_at = None

    task.status = new_status
    db.flush()

    if new_status == "done":
        _log_activity(db, user_id, "completed", task.title)
    else:
        _log_activity(db, user_id, "moved", task.title, f"to {_STATUS_LABELS[new_status]}")

    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=schemas.TaskOut)
def complete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    task = _get_owned_task(db, task_id, user_id)
    if task.status != "done":
        task.completed_at = datetime.now(timezone.utc)
    task.status = "done"
    db.flush()

    _log_activity(db, user_id, "completed", task.title)

    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/reopen", response_model=schemas.TaskOut)
def reopen_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    task = _get_owned_task(db, task_id, user_id)
    task.status = "todo"
    task.completed_at = None
    db.flush()

    _log_activity(db, user_id, "reopened", task.title)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    task = _get_owned_task(db, task_id, user_id)
    title = task.title
    db.delete(task)

    _log_activity(db, user_id, "deleted", title)

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
