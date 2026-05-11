from __future__ import annotations

import pytest

from tests.helpers import api_call


@pytest.mark.integration
@pytest.mark.asyncio
async def test_health_ok(client):
    call = await api_call(client, "GET", "/health")
    assert call.status_code == 200
    assert isinstance(call.response_json, dict)
    assert call.response_json.get("status") == "ok"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_auth_me_requires_authorization_header(client):
    call = await api_call(client, "GET", "/auth/me")
    # FastAPI validation error because Header(...) is required
    assert call.status_code == 422


@pytest.mark.integration
@pytest.mark.asyncio
async def test_auth_me_with_invalid_format_returns_401(client):
    call = await api_call(client, "GET", "/auth/me", headers={"Authorization": "Token abc"})
    assert call.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_auth_me_with_jwt(jwt_headers, client):
    call = await api_call(client, "GET", "/auth/me", headers=jwt_headers)
    assert call.status_code == 200
    assert isinstance(call.response_json, dict)
    assert "id" in call.response_json
    assert "email" in call.response_json
    assert "username" in call.response_json
