# AGENTS.md — SafeRoute v2
> AI agent instruction file for SafeRoute backend.
> Read this file fully before writing any code.
> Follow execution order strictly. One file per agent session.

---

## Project Summary

SafeRoute is a backend-only, OpenAI-compatible LLM routing API.

User creates an account, makes a virtual key, and assigns 3 models to it (Weak / Mid / Strong). Each model can be any OpenAI-compatible provider (NVIDIA, Groq, Together, OpenAI etc). User puts `lmr-xxxx` as their API key and points `base_url` to LLMRouter. Every request is automatically classified and routed to the cheapest model that can handle it. Response is streamed back. Every request is logged to PostHog for analytics.

**This is a college project — build clean, working, demonstrable. No over-engineering.**

---

## Architecture

```
Client (OpenAI SDK)
Authorization: Bearer lmr-xxxx
base_url: https://llmrouter.onrender.com
        ↓
┌─────────────────────────────────┐
│  LAYER 1 — Auth & Gateway       │
│  Validate virtual key           │
│  Load model config for key      │
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│  LAYER 2 — Routing Engine       │
│  extract_features(prompt)       │
│  XGBoost → tier 0 / 1 / 2      │
│  confidence < 0.6 → upgrade     │
│  Dispatch to provider           │
│  Stream response back           │
└─────────────────────────────────┘
        ↓ (non-blocking, after stream)
┌─────────────────────────────────┐
│  TELEMETRY                      │
│  PostHog event capture          │
│  Request metadata only          │
│  Never log full prompt          │
└─────────────────────────────────┘
```

---

## Provider Strategy

Only OpenAI-compatible providers supported right now.
User supplies: `base_url` + `api_key` + `model_name` per tier.

```
Provider        base_url
─────────────────────────────────────────────────
OpenAI          https://api.openai.com/v1
NVIDIA          https://integrate.api.nvidia.com/v1
Groq            https://api.groq.com/openai/v1
Together        https://api.together.xyz/v1
OpenRouter      https://openrouter.ai/api/v1
Fireworks       https://api.fireworks.ai/inference/v1
```

All use the same OpenAI Python SDK — just swap `base_url` and `api_key`.
Anthropic is NOT supported yet — different SDK format. Document as future work.

---

## File Structure

```
llmrouter/
├── AGENTS.md
├── main.py
├── requirements.txt
├── .env
├── render.yaml
│
├── core/
│   ├── feature_extractor.py
│   ├── router.py
│   ├── dispatcher.py
│   └── models/
│       ├── router_classifier.pkl
│       └── router_regressor.pkl
│
├── auth/
│   ├── password.py
│   ├── jwt_handler.py
│   └── dependencies.py
│
├── db/
│   ├── database.py
│   ├── models.py
│   └── crud.py
│
├── services/
│   └── telemetry.py
│
└── api/
    └── v1/
        ├── auth.py
        ├── keys.py
        ├── chat.py
        └── analytics.py
```

---

## Environment Variables

```env
# Supabase / Postgres
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host]:5432/postgres

# JWT
JWT_SECRET=your_random_secret_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=30

# Encryption (for stored provider API keys)
ENCRYPTION_KEY=your_fernet_key

# PostHog
POSTHOG_API_KEY=phc_xxxxxxxxxxxx
POSTHOG_HOST=https://app.posthog.com

# App
APP_ENV=production
```

---

## Execution Order

```
Step 1  → requirements.txt
Step 2  → db/database.py
Step 3  → db/models.py
Step 4  → db/crud.py
Step 5  → auth/password.py
Step 6  → auth/jwt_handler.py
Step 7  → auth/dependencies.py
Step 8  → services/telemetry.py
Step 9  → core/feature_extractor.py
Step 10 → core/router.py
Step 11 → core/dispatcher.py
Step 12 → api/v1/auth.py
Step 13 → api/v1/keys.py
Step 14 → api/v1/chat.py
Step 15 → api/v1/analytics.py
Step 16 → main.py
Step 17 → render.yaml
```

---

## Step 1 — requirements.txt

```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
python-jose[cryptography]
passlib[bcrypt]
httpx
openai
xgboost
scikit-learn
pandas
textstat
python-dotenv
pydantic
pydantic-settings
cryptography
posthog
```

---

## Step 2 — db/database.py

```python
# Async SQLAlchemy engine using DATABASE_URL from .env
# Implement:

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Create engine from DATABASE_URL env var
# Create async_sessionmaker
# Implement get_db() as async generator — used as FastAPI dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

---

## Step 3 — db/models.py

**Purpose:** All database tables.

### Table: User
```
id            UUID primary key, default uuid4
email         String, unique, not null
username      String, not null
password_hash String, not null
created_at    DateTime, default now()
```

### Table: VirtualKey
```
id               UUID primary key, default uuid4
user_id          UUID, foreign key → User.id, on delete CASCADE
name             String                        ← user label e.g. "prod"
key_hash         String, unique                ← SHA256 of lmr-xxxx
weak_model       String
weak_api_key     String                        ← Fernet encrypted
weak_base_url    String
mid_model        String
mid_api_key      String                        ← Fernet encrypted
mid_base_url     String
strong_model     String
strong_api_key   String                        ← Fernet encrypted
strong_base_url  String
is_active        Boolean, default True
created_at       DateTime, default now()
last_used_at     DateTime, nullable
```

### Table: RequestLog
```
id                UUID primary key, default uuid4
virtual_key_id    UUID, foreign key → VirtualKey.id
user_id           UUID, foreign key → User.id
prompt_preview    String                ← first 200 chars only
prompt_length     Integer
tier_assigned     Integer               ← 0, 1, 2
confidence        Float
model_used        String
input_tokens      Integer, nullable
output_tokens     Integer, nullable
latency_ms        Integer
cost_estimate_usd Float, nullable
status            String                ← "success" | "error"
error_message     String, nullable
created_at        DateTime, default now()
```

---

## Step 4 — db/crud.py

**All functions async. Import and use Fernet encryption for api keys.**

```python
# Encryption helpers (implement at top of file)
from cryptography.fernet import Fernet
import os, hashlib

fernet = Fernet(os.getenv("ENCRYPTION_KEY").encode())

def encrypt(val: str) -> str:
    return fernet.encrypt(val.encode()).decode()

def decrypt(val: str) -> str:
    return fernet.decrypt(val.encode()).decode()

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()
```

```python
# User
async def create_user(db, email, username, password_hash) -> User
async def get_user_by_email(db, email) -> User | None
async def get_user_by_id(db, user_id) -> User | None

# Virtual keys
async def create_virtual_key(
    db, user_id, name,
    weak_model, weak_api_key, weak_base_url,
    mid_model, mid_api_key, mid_base_url,
    strong_model, strong_api_key, strong_base_url,
) -> tuple[VirtualKey, str]
    # 1. generate lmr- + secrets.token_hex(32)
    # 2. encrypt each api_key with Fernet
    # 3. store SHA256 hash of virtual key
    # 4. return (VirtualKey, plaintext_key) — plaintext shown once only

async def get_key_by_hash(db, key_hash) -> VirtualKey | None
async def list_keys(db, user_id) -> list[VirtualKey]
async def revoke_key(db, key_id, user_id) -> bool
async def touch_key(db, key_id) -> None   ← update last_used_at

# Logging
async def log_request(db, **fields) -> RequestLog

# Analytics
async def get_stats(db, user_id, key_id=None, days=30) -> dict
    # Returns:
    # {
    #   total_requests, by_tier: {0: n, 1: n, 2: n},
    #   total_cost_usd, cost_saved_vs_always_strong,
    #   avg_latency_ms, success_rate,
    #   requests_by_day: [{date, count}]
    # }

async def get_request_logs(db, user_id, key_id=None, limit=50, offset=0) -> list[RequestLog]
```

---

## Step 5 — auth/password.py

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str
def verify_password(plain: str, hashed: str) -> bool
```

---

## Step 6 — auth/jwt_handler.py

```python
# Implement:
def create_token(user_id: str) -> str
    # payload: { "sub": user_id, "exp": now + JWT_EXPIRE_DAYS }

def decode_token(token: str) -> dict
    # raises HTTPException 401 if invalid or expired
```

---

## Step 7 — auth/dependencies.py

```python
# Two separate dependencies:

async def get_current_user(
    authorization: str = Header(...),
    db = Depends(get_db)
) -> User
    # For: /keys/*, /analytics/*, /auth/me
    # Extract Bearer JWT → verify → return User

async def get_virtual_key(
    authorization: str = Header(...),
    db = Depends(get_db)
) -> VirtualKey
    # For: /v1/chat/completions ONLY
    # Extract Bearer lmr-xxxx → hash → lookup → return VirtualKey
    # Raise 401 if not found or is_active=False
```

---

## Step 8 — services/telemetry.py

```python
import posthog
import os

posthog.api_key  = os.getenv("POSTHOG_API_KEY")
posthog.host     = os.getenv("POSTHOG_HOST")

def capture_request(
    user_id: str,
    event: str = "llm_request",
    properties: dict = {}
):
    # Capture PostHog event
    # properties should include:
    # tier_assigned, tier_name, confidence, model_used,
    # latency_ms, input_tokens, output_tokens,
    # cost_estimate_usd, status, prompt_length
    # NEVER include prompt text
    posthog.capture(
        distinct_id=user_id,
        event=event,
        properties=properties
    )

def capture_error(user_id: str, error: str, context: dict = {}):
    posthog.capture(
        distinct_id=user_id,
        event="llm_request_error",
        properties={"error": error, **context}
    )
```

---

## Step 9 — core/feature_extractor.py

```python
import re, textstat

PATTERNS = {
    "is_coding"    : r"\b(code|implement|function|class|algorithm|program|script|api|def |return)\b",
    "is_debugging" : r"\b(debug|error|traceback|exception|fix|bug|crash|not working|segfault)\b",
    "is_reasoning" : r"\b(explain|why|how does|analyze|compare|difference|evaluate)\b",
    "is_creative"  : r"\b(poem|story|creative|imagine|fiction|narrative|compose)\b",
    "is_multistep" : r"\b(design|architecture|plan|scalable|system|steps to|roadmap|build)\b",
    "is_math"      : r"\b(solve|calculate|equation|integral|derivative|probability|proof)\b",
    "is_summarize" : r"\b(summarize|summary|tldr|brief|overview|condense)\b",
    "is_simple_qa" : r"\b(what is|who is|when did|where is|capital of|define|meaning of)\b",
}

FEATURE_ORDER = [
    "char_count","word_count","sentence_count","avg_word_length",
    "unique_word_ratio","avg_sentence_len","fk_grade","has_code_block",
    "has_numbers","question_count","comma_count","has_bullet",
    "has_constraints","caps_ratio","is_coding","is_debugging",
    "is_reasoning","is_creative","is_multistep","is_math",
    "is_summarize","is_simple_qa","complexity_score"
]

def extract_features(text: str) -> dict:
    # Returns dict with all 23 keys
    # Statistical, readability, structural, keyword flags, complexity_score
    # See original feature_extraction.py for full implementation

def get_feature_vector(text: str) -> list[float]:
    feats = extract_features(text)
    return [feats[k] for k in FEATURE_ORDER]
```

Copy full implementation from `scripts/feature_extraction.py` — do not rewrite.

---

## Step 10 — core/router.py

```python
import pickle, numpy as np
from core.feature_extractor import get_feature_vector

CLASSIFIER = None
REGRESSOR  = None
CONFIDENCE_THRESHOLD = 0.60
TIER_NAMES = {0: "weak", 1: "mid", 2: "strong"}

def load_models():
    # Called once at startup
    global CLASSIFIER, REGRESSOR
    with open("core/models/router_classifier.pkl","rb") as f:
        CLASSIFIER = pickle.load(f)
    with open("core/models/router_regressor.pkl","rb") as f:
        REGRESSOR = pickle.load(f)

def route_prompt(prompt: str) -> dict:
    features   = get_feature_vector(prompt)
    probs      = CLASSIFIER.predict_proba([features])[0]
    tier       = int(np.argmax(probs))
    confidence = float(probs[tier])
    difficulty = float(REGRESSOR.predict([features])[0])

    upgraded = False
    if confidence < CONFIDENCE_THRESHOLD and tier < 2:
        tier += 1
        upgraded = True

    return {
        "tier"            : tier,
        "tier_name"       : TIER_NAMES[tier],
        "confidence"      : round(confidence, 4),
        "difficulty_score": round(difficulty, 4),
        "upgraded"        : upgraded,
    }
```

---

## Step 11 — core/dispatcher.py

```python
from openai import AsyncOpenAI
from db.crud import decrypt
from typing import AsyncIterator

TIER_MAP = {0: "weak", 1: "mid", 2: "strong"}

def get_client(virtual_key, tier: int) -> tuple[AsyncOpenAI, str]:
    t = TIER_MAP[tier]
    model    = getattr(virtual_key, f"{t}_model")
    api_key  = decrypt(getattr(virtual_key, f"{t}_api_key"))
    base_url = getattr(virtual_key, f"{t}_base_url")
    client   = AsyncOpenAI(api_key=api_key, base_url=base_url)
    return client, model

async def dispatch_stream(
    messages: list[dict],
    virtual_key,
    tier: int,
) -> AsyncIterator:
    client, model = get_client(virtual_key, tier)
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )
    return stream, model

async def dispatch_sync(
    messages: list[dict],
    virtual_key,
    tier: int,
) -> dict:
    client, model = get_client(virtual_key, tier)
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=False,
    )
    return response, model
```

---

## Step 12 — api/v1/auth.py

```
POST /auth/register
Body: { email, username, password }
Validation:
  - email must be unique
  - password min 8 chars
Response: { token, user: { id, email, username } }

POST /auth/login
Body: { email, password }
Response: { token, user: { id, email, username } }

GET /auth/me
Requires: JWT
Response: { id, email, username, created_at }
```

---

## Step 13 — api/v1/keys.py

All routes require JWT auth.

```
POST /keys/create
Body: {
  "name": "production",
  "weak_model":     "meta/llama-3.1-8b-instruct",
  "weak_api_key":   "nvapi-xxx",
  "weak_base_url":  "https://integrate.api.nvidia.com/v1",
  "mid_model":      "mistralai/mixtral-8x7b-instruct-v0.1",
  "mid_api_key":    "nvapi-xxx",
  "mid_base_url":   "https://integrate.api.nvidia.com/v1",
  "strong_model":   "meta/llama-3.3-70b-instruct",
  "strong_api_key": "nvapi-xxx",
  "strong_base_url":"https://integrate.api.nvidia.com/v1"
}
Response: {
  "key": "lmr-xxxx",    ← shown ONCE, never again
  "key_id": "uuid",
  "name": "production"
}

GET /keys/list
Response: [{
  key_id, name,
  weak_model, mid_model, strong_model,
  is_active, created_at, last_used_at
}]
# Never return raw api_keys or key plaintext

POST /keys/revoke
Body: { "key_id": "uuid" }
Response: { "success": true }
```

---

## Step 14 — api/v1/chat.py

```
POST /v1/chat/completions
Authorization: Bearer lmr-xxxx
Body: standard OpenAI chat completions request
```

**Full implementation:**

```python
@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    background_tasks: BackgroundTasks,
    virtual_key: VirtualKey = Depends(get_virtual_key),
    db = Depends(get_db),
):
    body = await request.json()
    messages = body.get("messages", [])
    stream   = body.get("stream", False)

    # 1. Extract last user message for routing
    prompt = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            prompt = m.get("content", "")
            break

    # 2. Route
    routing = route_prompt(prompt)
    start   = time.time()

    # 3a. Streaming response
    if stream:
        async def stream_generator():
            usage = {"input_tokens": None, "output_tokens": None}
            status = "success"
            error_msg = None
            try:
                stream_obj, model_used = await dispatch_stream(
                    messages, virtual_key, routing["tier"]
                )
                # Inject x-llmrouter in first chunk
                first = True
                async for chunk in stream_obj:
                    if first:
                        chunk_dict = chunk.model_dump()
                        chunk_dict["x-llmrouter"] = routing
                        yield f"data: {json.dumps(chunk_dict)}\n\n"
                        first = False
                    else:
                        yield f"data: {chunk.model_dump_json()}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                status = "error"
                error_msg = str(e)
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                latency_ms = int((time.time() - start) * 1000)
                background_tasks.add_task(
                    _log, db, virtual_key, prompt, routing,
                    model_used, usage, latency_ms, status, error_msg
                )

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    # 3b. Non-streaming response
    else:
        try:
            response, model_used = await dispatch_sync(
                messages, virtual_key, routing["tier"]
            )
            latency_ms = int((time.time() - start) * 1000)
            result = response.model_dump()
            result["x-llmrouter"] = routing
            background_tasks.add_task(
                _log, db, virtual_key, prompt, routing, model_used,
                {"input_tokens": response.usage.prompt_tokens,
                 "output_tokens": response.usage.completion_tokens},
                latency_ms, "success", None
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


async def _log(db, virtual_key, prompt, routing, model_used, usage, latency_ms, status, error_msg):
    # 1. Write to PostgreSQL
    await crud.log_request(
        db,
        virtual_key_id    = virtual_key.id,
        user_id           = virtual_key.user_id,
        prompt_preview    = prompt[:200],
        prompt_length     = len(prompt),
        tier_assigned     = routing["tier"],
        confidence        = routing["confidence"],
        model_used        = model_used,
        input_tokens      = usage.get("input_tokens"),
        output_tokens     = usage.get("output_tokens"),
        latency_ms        = latency_ms,
        cost_estimate_usd = _estimate_cost(model_used, usage),
        status            = status,
        error_message     = error_msg,
    )
    # 2. Send to PostHog
    capture_request(
        user_id    = str(virtual_key.user_id),
        properties = {
            "tier_assigned"    : routing["tier"],
            "tier_name"        : routing["tier_name"],
            "confidence"       : routing["confidence"],
            "model_used"       : model_used,
            "latency_ms"       : latency_ms,
            "input_tokens"     : usage.get("input_tokens"),
            "output_tokens"    : usage.get("output_tokens"),
            "status"           : status,
            "prompt_length"    : len(prompt),
        }
    )

def _estimate_cost(model: str, usage: dict) -> float:
    # Simple flat estimate — extend with real pricing table later
    total_tokens = (usage.get("input_tokens") or 0) + (usage.get("output_tokens") or 0)
    return round(total_tokens * 0.000002, 6)
```

---

## Step 15 — api/v1/analytics.py

JWT auth required. All data from RequestLog table.

```
GET /analytics/summary?key_id=optional&days=30
Response: {
  "total_requests": 1000,
  "by_tier": { "weak": 450, "mid": 380, "strong": 170 },
  "total_cost_usd": 3.42,
  "cost_saved_vs_always_strong": 18.58,
  "avg_latency_ms": 1240,
  "success_rate": 0.987
}

GET /analytics/requests?key_id=optional&limit=50&offset=0
Response: paginated RequestLog rows

GET /analytics/daily?key_id=optional&days=30
Response: [{ "date": "2024-01-15", "requests": 120, "cost_usd": 0.42 }]
```

---

## Step 16 — main.py

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from core.router import load_models
from db.database import engine, Base
from api.v1 import auth, keys, chat, analytics

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

app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(keys.router,      prefix="/keys",      tags=["Keys"])
app.include_router(chat.router,      prefix="/v1",        tags=["Chat"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

@app.get("/health")
async def health():
    from core.router import CLASSIFIER
    return {"status": "ok", "model_loaded": CLASSIFIER is not None}
```

---

## Step 17 — render.yaml

```yaml
services:
  - type: web
    name: llmrouter
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: ENCRYPTION_KEY
        sync: false
      - key: POSTHOG_API_KEY
        sync: false
      - key: POSTHOG_HOST
        sync: false
```

---

## Non-Negotiable Rules

1. **Never log full prompt** — first 200 chars only as `prompt_preview`
2. **Never store plaintext API keys** — Fernet encrypt before DB, decrypt only in dispatcher
3. **Never store plaintext virtual key** — SHA256 hash only, return plaintext once
4. **DB write + PostHog always background** — response/stream goes out first
5. **Models load once at startup** — never per request
6. **Feature order fixed** — `get_feature_vector()` must match training column order exactly
7. **x-llmrouter in every response** — both streaming and non-streaming
8. **3 models per virtual key** — model config belongs to key not user
9. **Streaming via StreamingResponse** — `text/event-stream` media type
10. **Anthropic not supported** — different SDK, document as future work

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
    