import jwt
import pytest
from httpx import AsyncClient

from app.core.config import settings


@pytest.mark.asyncio
async def test_complete_auth_flow(client: AsyncClient) -> None:
    registration = await client.post(
        "/api/v1/auth/register",
        json={"email": "New@Example.com", "username": "New_User", "password": "very-safe-password"},
    )
    assert registration.status_code == 201
    assert registration.json()["email"] == "new@example.com"
    assert "password" not in registration.text

    duplicate = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "new@example.com",
            "username": "someone",
            "password": "another-safe-password",
        },
    )
    assert duplicate.status_code == 409

    bad_login = await client.post(
        "/api/v1/auth/login", json={"email": "new@example.com", "password": "wrong"}
    )
    assert bad_login.status_code == 401

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "new@example.com", "password": "very-safe-password"},
    )
    assert login.status_code == 200
    tokens = login.json()

    me = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["username"] == "new_user"

    refresh = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refresh.status_code == 200
    rotated_tokens = refresh.json()
    assert rotated_tokens["refresh_token"] != tokens["refresh_token"]

    reuse = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert reuse.status_code == 401

    # После обнаружения reuse новая сессия тоже должна быть отозвана.
    revoked = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": rotated_tokens["refresh_token"]}
    )
    assert revoked.status_code == 401


@pytest.mark.asyncio
async def test_access_token_cannot_be_used_as_refresh(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "person@example.com", "username": "person", "password": "safe-password-123"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "person@example.com", "password": "safe-password-123"},
    )
    access = login.json()["access_token"]
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": access})
    assert response.status_code == 401

    payload = jwt.decode(
        access,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
    )
    assert payload["type"] == "access"


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "logout@example.com",
            "username": "logout_user",
            "password": "safe-password-123",
        },
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "logout@example.com", "password": "safe-password-123"},
    )
    refresh_token = login.json()["refresh_token"]

    logout = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 204
    after_logout = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert after_logout.status_code == 401
