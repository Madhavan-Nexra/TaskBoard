# TaskBuddy API Contract

Single source of truth for the FastAPI backend and the React frontend. Both must match this exactly.

## Stack

- Frontend: React (Vite + TypeScript) + Tailwind CSS. Auth via `@supabase/supabase-js` (Supabase Auth directly from the browser).
- Backend: Python + FastAPI + SQLAlchemy, connects directly to the Supabase Postgres database (`DATABASE_URL`). It does NOT use the Supabase client library — it only verifies the Supabase-issued JWT and runs SQL.
- Database: Supabase Postgres. Schema lives in `supabase/schema.sql` — the user runs this once in the Supabase SQL editor.

## Auth flow

1. Frontend signs up / logs in using `supabase.auth.signUp` / `signInWithPassword`.
2. On every request to the FastAPI backend, the frontend attaches `Authorization: Bearer <access_token>` from the current Supabase session.
3. FastAPI verifies the JWT against Supabase's public JWKS (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, ES256/RS256), validates `aud == "authenticated"` and expiry, and reads `sub` as the user's UUID (`user_id`). Every query is scoped to `user_id`.
4. If the token is missing/invalid/expired, return `401 {"detail": "Not authenticated"}`.
5. Frontend must redirect to `/login` on any `401` response from the API.

## Env vars

Backend `.env`:
```
DATABASE_URL=postgresql+psycopg2://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
CORS_ORIGINS=http://localhost:5173
```

Frontend `.env`:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_API_BASE_URL=http://localhost:8001/api
```

## Data model

### Task
```ts
type Priority = "low" | "medium" | "high"
type Status = "todo" | "doing" | "done"
type Category = "learning" | "work" | "ai" | "rocket" | "personal"

interface Task {
  id: string            // uuid
  title: string
  description: string | null
  priority: Priority
  status: Status
  category: Category
  due_at: string | null      // ISO 8601 datetime, nullable
  progress: number | null    // 0-100, only meaningful for "doing" tasks
  completed_at: string | null // ISO 8601 datetime, set when status becomes "done"
  created_at: string
  updated_at: string
}
```

Category display mapping (frontend owns this, backend just stores the slug):
| slug | label | color token |
|---|---|---|
| learning | Learning | amber |
| work | Work | slate/blue |
| ai | AI | violet |
| rocket | Rocket | orange |
| personal | Personal | teal |

Priority color mapping: `low` = slate, `medium` = blue, `high` = red/orange.

### Settings
```ts
interface Settings {
  theme: "light" | "dark"
  enable_reminders: boolean
  highlight_overdue: boolean
  sound_on: boolean
  daily_goal: number   // tasks/day target used for the "Daily Goal" ring
}
```

### ActivityLogEntry
```ts
interface ActivityLogEntry {
  id: string
  action: "created" | "moved" | "completed" | "reopened" | "updated" | "deleted"
  task_title: string
  detail: string | null   // e.g. "to Doing"
  created_at: string
}
```

## Endpoints

All prefixed with `/api`. All require the `Authorization` header except `/health`.

### `GET /health`
No auth. Returns `{"status": "ok"}`.

### Tasks

- `GET /tasks?status=&category=&search=` → `Task[]`
  Optional filters; omit to get all of the current user's tasks (frontend groups by status client-side for the board).
- `POST /tasks` → body `TaskCreate` (title required; description, priority, category, due_at, progress optional; status defaults to `"todo"`) → `Task` (201). Logs activity `created`.
- `GET /tasks/{task_id}` → `Task` (404 if not found or not owned by user)
- `PUT /tasks/{task_id}` → body `TaskUpdate` (all fields optional, partial update) → `Task`. Logs activity `updated`.
- `PATCH /tasks/{task_id}/status` → body `{"status": Status}` → `Task`. Moving to `"done"` sets `completed_at=now()`; moving away from `"done"` clears it. Logs activity `moved` (detail `"to <Status label>"`) or `completed` if new status is `done`.
- `POST /tasks/{task_id}/complete` → shortcut for `PATCH .../status {"status":"done"}` → `Task`. Logs `completed`.
- `POST /tasks/{task_id}/reopen` → sets `status="todo"`, `completed_at=null` → `Task`. Logs `reopened`.
- `DELETE /tasks/{task_id}` → 204. Logs `deleted`.

### Stats

- `GET /stats/board` →
```ts
{ total_tasks: number, todo: number, doing: number, done: number, overdue: number }
```
`overdue` = tasks with `status != "done"` and `due_at < now()`.

- `GET /stats/history` →
```ts
{
  completed_this_week: number,
  completed_this_week_delta: number,   // vs previous 7-day window
  completed_this_month: number,
  completed_last_8_weeks: number[],    // for the small sparkline bars, oldest->newest
  total_completed: number,
  daily_goal_percent: number           // min(100, round(completed_today / settings.daily_goal * 100))
}
```

### History

- `GET /history?range=today|week|month|all&category=&search=` → `Task[]` where `status="done"`, sorted `completed_at desc`. Frontend groups by completed date and renders "Today" / "Yesterday" / date headers.

### Activity

- `GET /activity/recent?limit=10` → `ActivityLogEntry[]`, newest first.

### Settings

- `GET /settings` → `Settings` (auto-creates a default row for the user on first call: theme=light, enable_reminders=true, highlight_overdue=true, sound_on=true, daily_goal=5).
- `PUT /settings` → body `Partial<Settings>` → `Settings` (upsert).

## Error shape

All errors: `{"detail": "<message>"}` with the appropriate HTTP status (400/401/404/422/500).
