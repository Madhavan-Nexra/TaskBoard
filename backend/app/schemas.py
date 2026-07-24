import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Priority = Literal["low", "medium", "high"]
Status = Literal["todo", "doing", "done"]
Category = Literal["learning", "work", "ai", "rocket", "personal"]
Action = Literal["created", "moved", "completed", "reopened", "updated", "deleted"]
Theme = Literal["light", "dark"]


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = "medium"
    status: Status = "todo"
    category: Category = "work"
    due_at: Optional[datetime] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    category: Optional[Category] = None
    due_at: Optional[datetime] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)


class TaskStatusUpdate(BaseModel):
    status: Status


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    priority: Priority
    status: Status
    category: Category
    due_at: Optional[datetime] = None
    progress: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
class StatsBoardOut(BaseModel):
    total_tasks: int
    todo: int
    doing: int
    done: int
    overdue: int


class StatsHistoryOut(BaseModel):
    completed_this_week: int
    completed_this_week_delta: int
    completed_this_month: int
    completed_last_8_weeks: List[int]
    total_completed: int
    daily_goal_percent: int


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
class SettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme: Theme
    enable_reminders: bool
    highlight_overdue: bool
    sound_on: bool
    daily_goal: int


class SettingsUpdate(BaseModel):
    theme: Optional[Theme] = None
    enable_reminders: Optional[bool] = None
    highlight_overdue: Optional[bool] = None
    sound_on: Optional[bool] = None
    daily_goal: Optional[int] = Field(default=None, gt=0)


# ---------------------------------------------------------------------------
# Activity
# ---------------------------------------------------------------------------
class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    action: Action
    task_title: str
    detail: Optional[str] = None
    created_at: datetime
