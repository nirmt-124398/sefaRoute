from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from db.database import get_db
from db.models import User
from db import crud

router = APIRouter()

class KeyCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    weak_model: str = Field(min_length=1)
    weak_api_key: str = Field(min_length=1)
    weak_base_url: str = Field(min_length=1)
    mid_model: str = Field(min_length=1)
    mid_api_key: str = Field(min_length=1)
    mid_base_url: str = Field(min_length=1)
    strong_model: str = Field(min_length=1)
    strong_api_key: str = Field(min_length=1)
    strong_base_url: str = Field(min_length=1)

class KeyCreateResponse(BaseModel):
    key: str
    key_id: str
    name: str

class KeyRevokeRequest(BaseModel):
    key_id: str

@router.post("/create", response_model=KeyCreateResponse)
async def create_key(
    payload: KeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    key_obj, raw_key = await crud.create_virtual_key(
        db,
        user_id=current_user.id,
        name=payload.name,
        weak_model=payload.weak_model,
        weak_api_key=payload.weak_api_key,
        weak_base_url=payload.weak_base_url,
        mid_model=payload.mid_model,
        mid_api_key=payload.mid_api_key,
        mid_base_url=payload.mid_base_url,
        strong_model=payload.strong_model,
        strong_api_key=payload.strong_api_key,
        strong_base_url=payload.strong_base_url,
    )

    return {
        "key": raw_key,
        "key_id": str(key_obj.id),
        "name": key_obj.name
    }

@router.get("/list")
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    keys = await crud.list_keys(db, user_id=current_user.id)
    return [
        {
            "key_id": str(k.id),
            "name": k.name,
            "weak_model": k.weak_model,
            "mid_model": k.mid_model,
            "strong_model": k.strong_model,
            "is_active": k.is_active,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at
        }
        for k in keys
    ]

@router.post("/revoke")
async def revoke_key(
    payload: KeyRevokeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    success = await crud.revoke_key(db, key_id=payload.key_id, user_id=current_user.id)
    return {"success": success}
