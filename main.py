from contextlib import asynccontextmanager
from fastapi import FastAPI

from api.v1 import auth, keys, chat, analytics
from core.router import load_models, CLASSIFIER
from db.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
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


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": CLASSIFIER is not None}
