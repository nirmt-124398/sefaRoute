import json
import time
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_virtual_key
from core.dispatcher import dispatch_stream, dispatch_sync
from core.router import route_prompt
from db.database import get_db
from db.models import VirtualKey
from db import crud
from services.telemetry import capture_request

router = APIRouter()

@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    background_tasks: BackgroundTasks,
    virtual_key: VirtualKey = Depends(get_virtual_key),
    db: AsyncSession = Depends(get_db),
):
    body = await request.json()
    messages = body.get("messages", [])
    stream = body.get("stream", False)

    prompt = ""
    for message in reversed(messages):
        if message.get("role") == "user":
            prompt = message.get("content", "")
            break

    routing = route_prompt(prompt)
    start = time.time()

    if stream:
        async def stream_generator():
            usage = {"input_tokens": None, "output_tokens": None}
            status = "success"
            error_msg = None
            model_used = None

            try:
                stream_obj, model_used = await dispatch_stream(
                    messages, virtual_key, routing["tier"]
                )
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

    try:
        response, model_used = await dispatch_sync(
            messages, virtual_key, routing["tier"]
        )
        latency_ms = int((time.time() - start) * 1000)
        result = response.model_dump()
        result["x-llmrouter"] = routing
        background_tasks.add_task(
            _log, db, virtual_key, prompt, routing, model_used,
            {
                "input_tokens": response.usage.prompt_tokens if response.usage else None,
                "output_tokens": response.usage.completion_tokens if response.usage else None,
            },
            latency_ms, "success", None
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


async def _log(
    db: AsyncSession,
    virtual_key: VirtualKey,
    prompt: str,
    routing: dict,
    model_used: str | None,
    usage: dict,
    latency_ms: int,
    status: str,
    error_msg: str | None
):
    model_name = model_used or "unknown"

    await crud.log_request(
        db,
        virtual_key_id=virtual_key.id,
        user_id=virtual_key.user_id,
        prompt_preview=prompt[:200],
        prompt_length=len(prompt),
        tier_assigned=routing["tier"],
        confidence=routing["confidence"],
        model_used=model_name,
        input_tokens=usage.get("input_tokens"),
        output_tokens=usage.get("output_tokens"),
        latency_ms=latency_ms,
        cost_estimate_usd=_estimate_cost(model_name, usage),
        status=status,
        error_message=error_msg,
    )

    await crud.touch_key(db, key_id=virtual_key.id)

    capture_request(
        user_id=str(virtual_key.user_id),
        properties={
            "tier_assigned": routing["tier"],
            "tier_name": routing["tier_name"],
            "confidence": routing["confidence"],
            "model_used": model_name,
            "latency_ms": latency_ms,
            "input_tokens": usage.get("input_tokens"),
            "output_tokens": usage.get("output_tokens"),
            "status": status,
            "prompt_length": len(prompt)
        }
    )


def _estimate_cost(model: str, usage: dict) -> float:
    total_tokens = (usage.get("input_tokens") or 0) + (usage.get("output_tokens") or 0)
    return round(total_tokens * 0.000002, 6)
