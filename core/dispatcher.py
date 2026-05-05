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
