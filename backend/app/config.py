from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from typing_extensions import Annotated


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    DATABASE_URL: str
    SUPABASE_URL: str
    CORS_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
