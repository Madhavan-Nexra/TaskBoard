# TaskBuddy

A full-stack Kanban-style task manager: React + Tailwind CSS frontend, Python (FastAPI) backend, Supabase (Postgres + Auth) database.

```
TaskBuddy/
├── frontend/          React + Vite + TypeScript + Tailwind CSS
├── backend/            FastAPI + SQLAlchemy
├── supabase/schema.sql SQL to run once in your Supabase project
├── API_CONTRACT.md     REST API spec shared by frontend & backend
└── DESIGN_SPEC.md       Page-by-page UI spec used to build the frontend
```

## How the pieces fit together

- **Supabase** hosts the Postgres database and handles user signup/login (Supabase Auth). The frontend talks to Supabase Auth directly.
- **Frontend** (React) signs users in via Supabase Auth, then calls the FastAPI backend for all task/history/settings data, attaching the Supabase session's access token as `Authorization: Bearer <token>`.
- **Backend** (FastAPI) verifies that token itself (no Supabase SDK involved) and talks to the same Supabase Postgres database directly via SQLAlchemy.

## First-time setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com) (or use your existing one).
2. Open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `tasks`, `user_settings`, and `activity_log` tables with row-level security enabled.
3. Collect three values from **Project Settings**:
   - **Settings → API → Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL` (same value, used by both frontend and backend)
   - **Settings → API → Project API keys → anon public** → `VITE_SUPABASE_ANON_KEY`
   - **Settings → Database → Connection string → URI** → `DATABASE_URL` (change the `postgresql://` prefix to `postgresql+psycopg2://`)
4. By default Supabase requires email confirmation for new signups. For local testing you can turn this off under **Authentication → Providers → Email → Confirm email**, or just confirm the email from the inbox you sign up with.

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
copy .env.example .env           # then fill in DATABASE_URL, SUPABASE_URL, CORS_ORIGINS
uvicorn app.main:app --reload --port 8001
```

API docs: http://localhost:8001/docs — see `backend/README.md` for details.

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env           # then fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm run dev
```

App: http://localhost:5173 — sign up for an account, then use the board.

## Running both together

Two terminals: one running `uvicorn app.main:app --reload --port 8001` in `backend/`, one running `npm run dev` in `frontend/`. The frontend's default `VITE_API_BASE_URL=http://localhost:8001/api` and the backend's default `CORS_ORIGINS=http://localhost:5173` already match, so no extra config is needed for local development.

## Verified

- Backend code was reviewed file-by-file against `API_CONTRACT.md` and `supabase/schema.sql` (no Python interpreter was available in this environment to execute it — review it once yourself before deploying).
- Frontend was built and `npm run build` verified to complete with zero TypeScript errors.
