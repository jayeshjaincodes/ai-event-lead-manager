import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import api_router
from app.core.config import settings

# Setup application logger
logger = logging.getLogger("app")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-grade REST API for managing event leads with pipeline status tracking and database-side search.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
# Uses FRONTEND_URL from settings without hardcoding or wildcarding in production
allowed_origins = [settings.FRONTEND_URL]
if settings.ENVIRONMENT == "development":
    for local_origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        if local_origin not in allowed_origins:
            allowed_origins.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global unhandled exception handler.
    Logs the internal exception safely on the server and returns a clean, sanitized HTTP 500
    without leaking database connection strings, credentials, or internal stack traces.
    """
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."},
    )


# Root health endpoint
@app.get("/health", tags=["Health"], summary="Root Health Check")
async def root_health():
    """Root health probe."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


# Mount API V1 Routes (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
