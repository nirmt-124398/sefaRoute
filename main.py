from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.schema import CreateSchema

from api.v1 import auth, keys, chat, analytics, users
from core import router as router_mod
from db.database import engine, Base, DB_SCHEMA
from services.error_tracking import init_sentry


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        if DB_SCHEMA:
            await conn.execute(CreateSchema(DB_SCHEMA, if_not_exists=True))
            await conn.execute(text(f"SET search_path TO {DB_SCHEMA}"))
        await conn.run_sync(Base.metadata.create_all)
    router_mod.load_models()
    init_sentry()
    yield


app = FastAPI(
    title="LLMRouter",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(keys.router, prefix="/keys", tags=["Keys"])
app.include_router(chat.router, prefix="/v1", tags=["Chat"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(users.router, prefix="/users", tags=["Users"])


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": router_mod.CLASSIFIER is not None}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled 500s — send to Sentry + PostHog, return JSON."""
    if isinstance(exc, HTTPException):
        raise exc

    with suppress(Exception):
        import sentry_sdk
        sentry_sdk.capture_exception(exc)

    with suppress(Exception):
        from services.telemetry import capture_error
        capture_error("unknown", str(exc), {"path": str(request.url)})

    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred"},
    )
