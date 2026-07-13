import io
from types import SimpleNamespace

import pytest
from httpx import AsyncClient
from PIL import Image


async def create_user(client: AsyncClient, name: str) -> tuple[dict, dict[str, str]]:
    password = f"password-for-{name}"
    registration = await client.post(
        "/api/v1/auth/register",
        json={"email": f"{name}@example.com", "username": name, "password": password},
    )
    assert registration.status_code == 201, registration.text
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": f"{name}@example.com", "password": password},
    )
    assert login.status_code == 200, login.text
    return registration.json(), {"Authorization": f"Bearer {login.json()['access_token']}"}


def png_file() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (32, 32), color=(30, 120, 220)).save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_profile_and_avatar(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    uploaded_contents: list[bytes] = []
    deleted_blobs: list[str] = []

    async def fake_upload(user_id, content: bytes):
        uploaded_contents.append(content)
        suffix = len(uploaded_contents)
        return SimpleNamespace(
            url=(f"https://example.public.blob.vercel-storage.com/avatars/{user_id}-{suffix}.webp"),
            pathname=f"avatars/{user_id}-{suffix}.webp",
        )

    async def fake_delete(url_or_pathname: str | None) -> None:
        if url_or_pathname:
            deleted_blobs.append(url_or_pathname)

    monkeypatch.setattr("app.api.routes.users.upload_avatar_blob", fake_upload)
    monkeypatch.setattr("app.api.routes.users.delete_avatar_blob", fake_delete)
    user, headers = await create_user(client, "profile_user")

    updated = await client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"username": "renamed_user"},
    )
    assert updated.status_code == 200
    assert updated.json()["username"] == "renamed_user"
    assert "bio" not in updated.json()

    public = await client.get(f"/api/v1/users/{user['id']}")
    assert public.status_code == 200
    assert "email" not in public.json()
    assert "bio" not in public.json()

    avatar = await client.post(
        "/api/v1/users/me/avatar",
        headers=headers,
        files={"file": ("avatar.png", png_file(), "image/png")},
    )
    assert avatar.status_code == 200, avatar.text
    avatar_url = avatar.json()["avatar_url"]
    assert avatar_url.startswith("https://example.public.blob.vercel-storage.com/")
    assert uploaded_contents[0].startswith(b"RIFF")

    replaced_avatar = await client.post(
        "/api/v1/users/me/avatar",
        headers=headers,
        files={"file": ("avatar.png", png_file(), "image/png")},
    )
    assert replaced_avatar.status_code == 200
    assert replaced_avatar.json()["avatar_url"].endswith(f"/{user['id']}-2.webp")
    assert deleted_blobs == [f"avatars/{user['id']}-1.webp"]

    invalid_avatar = await client.post(
        "/api/v1/users/me/avatar",
        headers=headers,
        files={"file": ("fake.png", b"not an image", "image/png")},
    )
    assert invalid_avatar.status_code == 422

    deleted = await client.delete("/api/v1/users/me/avatar", headers=headers)
    assert deleted.status_code == 204
    assert deleted_blobs == [
        f"avatars/{user['id']}-1.webp",
        f"avatars/{user['id']}-2.webp",
    ]
    me = await client.get("/api/v1/users/me", headers=headers)
    assert me.json()["avatar_url"] is None


@pytest.mark.asyncio
async def test_listing_order_and_order_chat_flow(client: AsyncClient) -> None:
    seller, seller_headers = await create_user(client, "seller_user")
    buyer, buyer_headers = await create_user(client, "buyer_user")
    _, outsider_headers = await create_user(client, "outsider_user")

    listing_response = await client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Level up account",
            "description": "I will level up your game account quickly",
            "category": "Games",
            "price_minor": 150000,
            "currency": "rub",
            "delivery_days": 3,
        },
    )
    assert listing_response.status_code == 201, listing_response.text
    listing = listing_response.json()
    assert listing["seller_id"] == seller["id"]
    assert listing["currency"] == "RUB"

    whitespace_listing = await client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "   ",
            "description": "          ",
            "category": "  ",
            "price_minor": 100,
            "delivery_days": 1,
        },
    )
    assert whitespace_listing.status_code == 422

    search = await client.get("/api/v1/listings", params={"q": "level", "category": "games"})
    assert search.status_code == 200
    assert [item["id"] for item in search.json()] == [listing["id"]]

    forbidden_edit = await client.patch(
        f"/api/v1/listings/{listing['id']}", headers=buyer_headers, json={"price_minor": 1}
    )
    assert forbidden_edit.status_code == 404

    self_order = await client.post(
        "/api/v1/orders",
        headers=seller_headers,
        json={"listing_id": listing["id"], "requirements": "My own order"},
    )
    assert self_order.status_code == 409

    created = await client.post(
        "/api/v1/orders",
        headers=buyer_headers,
        json={"listing_id": listing["id"], "requirements": "Reach level 50"},
    )
    assert created.status_code == 201, created.text
    order = created.json()
    assert order["price_minor"] == 150000
    assert order["status"] == "pending"

    outsider_order = await client.get(f"/api/v1/orders/{order['id']}", headers=outsider_headers)
    assert outsider_order.status_code == 404

    edited = await client.patch(
        f"/api/v1/orders/{order['id']}",
        headers=buyer_headers,
        json={"requirements": "Reach level 55", "version": order["version"]},
    )
    assert edited.status_code == 200
    order = edited.json()

    wrong_actor = await client.post(
        f"/api/v1/orders/{order['id']}/status",
        headers=buyer_headers,
        json={"status": "accepted", "version": order["version"]},
    )
    assert wrong_actor.status_code == 409

    stale = await client.patch(
        f"/api/v1/orders/{order['id']}",
        headers=buyer_headers,
        json={"requirements": "Stale update", "version": 1},
    )
    assert stale.status_code == 409

    conversation_response = await client.post(
        "/api/v1/chats",
        headers=buyer_headers,
        json={"order_id": order["id"]},
    )
    assert conversation_response.status_code == 201
    conversation = conversation_response.json()

    outsider_chat = await client.get(
        f"/api/v1/chats/{conversation['id']}", headers=outsider_headers
    )
    assert outsider_chat.status_code == 404

    sent = await client.post(
        f"/api/v1/chats/{conversation['id']}/messages",
        headers=seller_headers,
        json={"body": "I can start now"},
    )
    assert sent.status_code == 201
    message = sent.json()

    inbox = await client.get("/api/v1/chats", headers=buyer_headers)
    assert inbox.status_code == 200
    assert inbox.json()[0]["unread_count"] == 1
    assert inbox.json()[0]["last_message"] == "I can start now"

    marked = await client.post(f"/api/v1/chats/{conversation['id']}/read", headers=buyer_headers)
    assert marked.json()["updated"] == 1

    edited_message = await client.patch(
        f"/api/v1/chats/{conversation['id']}/messages/{message['id']}",
        headers=seller_headers,
        json={"body": "Starting now"},
    )
    assert edited_message.status_code == 200
    removed_message = await client.delete(
        f"/api/v1/chats/{conversation['id']}/messages/{message['id']}",
        headers=seller_headers,
    )
    assert removed_message.status_code == 204
    messages = await client.get(
        f"/api/v1/chats/{conversation['id']}/messages", headers=buyer_headers
    )
    assert messages.json()[0]["body"] == "Сообщение удалено"

    for actor_headers, new_status in [
        (seller_headers, "accepted"),
        (seller_headers, "in_progress"),
        (seller_headers, "delivered"),
        (buyer_headers, "completed"),
    ]:
        transitioned = await client.post(
            f"/api/v1/orders/{order['id']}/status",
            headers=actor_headers,
            json={"status": new_status, "version": order["version"]},
        )
        assert transitioned.status_code == 200, transitioned.text
        order = transitioned.json()

    hidden = await client.delete(f"/api/v1/orders/{order['id']}", headers=buyer_headers)
    assert hidden.status_code == 204
    buyer_orders = await client.get("/api/v1/orders", headers=buyer_headers)
    assert buyer_orders.json() == []
    seller_orders = await client.get("/api/v1/orders", headers=seller_headers)
    assert [item["id"] for item in seller_orders.json()] == [order["id"]]

    removed_listing = await client.delete(
        f"/api/v1/listings/{listing['id']}", headers=seller_headers
    )
    assert removed_listing.status_code == 204
    inactive = await client.get("/api/v1/listings")
    assert inactive.json() == []


@pytest.mark.asyncio
async def test_direct_chat_is_reused(client: AsyncClient) -> None:
    first, first_headers = await create_user(client, "direct_one")
    second, second_headers = await create_user(client, "direct_two")

    created = await client.post(
        "/api/v1/chats", headers=first_headers, json={"recipient_id": second["id"]}
    )
    assert created.status_code == 201
    reverse = await client.post(
        "/api/v1/chats", headers=second_headers, json={"recipient_id": first["id"]}
    )
    assert reverse.status_code == 201
    assert reverse.json()["id"] == created.json()["id"]
