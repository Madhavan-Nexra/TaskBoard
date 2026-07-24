from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import activity, history, settings as settings_router, stats, tasks

app = FastAPI(title="TaskBuddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
