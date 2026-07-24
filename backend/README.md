# TaskBuddy Backend

FastAPI backend for TaskBuddy. Connects directly to the Supabase Postgres
database via SQLAlchemy (no PostgREST, no `supabase-py`) and verifies
Supabase-issued JWTs itself.

## Prerequisites

Run `supabase/schema.sql` once in the Supabase SQL editor (Project > SQL
Editor > New query) before starting the backend. This creates the `tasks`,
`user_settings`, and `activity_log` tables the API expects.

## Setup

1. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS / Linux
   source venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — from the Supabase dashboard: Settings > Database >
     Connection string > URI. Take the connection string Supabase gives you
     and change its scheme from `postgresql://` to `postgresql+psycopg2://`,
     e.g.:

     ```
     DATABASE_URL=postgresql+psycopg2://postgres:<password>@<host>:5432/postgres
     ```

   - `SUPABASE_URL` — from the Supabase dashboard: Settings > API > Project
     URL. Used to fetch the project's public JWKS for verifying tokens.

   - `CORS_ORIGINS` — comma-separated list of allowed frontend origins, e.g.
     `http://localhost:5173`.

4. Run the API:

   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

   The API is now available at `http://localhost:8001/api`, with interactive
   docs at `http://localhost:8001/docs`.

## Notes

- Every request except `GET /api/health` requires an `Authorization: Bearer
  <access_token>` header containing a valid Supabase session access token.
  The token is verified locally against Supabase's public JWKS (fetched from
  `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, algorithms `ES256`/`RS256`,
  audience `authenticated`) — the backend never calls out to Supabase Auth
  itself, only to its (public, unauthenticated) key-set endpoint.
- All queries are scoped to the authenticated user's `sub` claim (`user_id`),
  so users can only ever see or modify their own rows.
