from pathlib import Path
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables or .env file.
    """
    model_config = SettingsConfigDict(
        env_file=(str(ENV_FILE_PATH), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core environment
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "AI Event Lead Manager"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

    # AI Configuration (Backend-only)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    GEMINI_TIMEOUT_SECONDS: float = 30.0

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_async_db_url(cls, v: Optional[str]) -> str:
        """
        Ensures the connection string uses the asyncpg driver (postgresql+asyncpg://)
        and formats query parameters for asyncpg compatibility (e.g. converting sslmode to ssl
        and removing unsupported libpq parameters like channel_binding).
        """
        if not v:
            return "postgresql+asyncpg://neondb_owner:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?ssl=require"
        
        import urllib.parse
        
        url = v.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # Clean query parameters for asyncpg
        parsed = urllib.parse.urlsplit(url)
        clean_params = []
        for k, val in urllib.parse.parse_qsl(parsed.query):
            if k == "sslmode":
                clean_params.append(("ssl", val))
            elif k in ("channel_binding",):
                continue
            else:
                clean_params.append((k, val))
        
        new_query = urllib.parse.urlencode(clean_params)
        return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))


settings = Settings()
