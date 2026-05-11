from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.schema import CreateSchema

from api.v1 import auth, keys, chat, analytics, users
from core.router import load_models, CLASSIFIER
from db.database import engine, Base, DB_SCHEMA


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        if DB_SCHEMA:
            await conn.execute(CreateSchema(DB_SCHEMA, if_not_exists=True))
            # Execute SET search_path without parameter binding which fails in asyncpg/PostgreSQL
            await conn.execute(text(f"SET search_path TO {DB_SCHEMA}"))
        await conn.run_sync(Base.metadata.create_all)
    load_models()
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
    return {"status": "ok", "model_loaded": CLASSIFIER is not None}
