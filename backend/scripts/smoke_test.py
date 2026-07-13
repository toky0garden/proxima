import asyncio
import io
import os
import time
from typing import Any

import httpx
from PIL import Image

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/")


def avatar_bytes() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (24, 24), (30, 140, 220)).save(output, "PNG")
    return output.getvalue()


async def main() -> None:
    results: list[str] = []
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15) as client:

        async def call(
            method: str,
            path: str,
            *,
            expected: int | set[int] = 200,
            headers: dict[str, str] | None = None,
            **kwargs: Any,
        ) -> httpx.Response:
            response = await client.request(method, path, headers=headers, **kwargs)
            expected_codes = {expected} if isinstance(expected, int) else expected
            if response.status_code not in expected_codes:
                raise AssertionError(
                    f"{method} {path}: expected {expected_codes}, got "
                    f"{response.status_code}: {response.text[:1000]}"
                )
            results.append(f"{response.status_code:3} {method:6} {path}")
            return response

        await call("GET", "/")
        await call("GET", "/api/v1/health")

        suffix = str(time.time_ns())[-12:]

        async def register_and_login(role: str) -> tuple[dict[str, Any], dict[str, str], str]:
            email = f"smoke_{role}_{suffix}@example.com"
            username = f"{role}_{suffix}"
            password = f"password-{role}-{suffix}"
            registration = await call(
                "POST",
                "/api/v1/auth/register",
                expected=201,
                json={"email": email, "username": username, "password": password},
            )
            login = await call(
                "POST",
                "/api/v1/auth/login",
                json={"email": email, "password": password},
            )
            tokens = login.json()
            return (
                registration.json(),
                {"Authorization": f"Bearer {tokens['access_token']}"},
                tokens["refresh_token"],
            )

        seller, seller_headers, seller_refresh = await register_and_login("seller")
        buyer, buyer_headers, buyer_refresh = await register_and_login("buyer")
        outsider, outsider_headers, outsider_refresh = await register_and_login("outsider")

        refreshed = await call(
            "POST",
            "/api/v1/auth/refresh",
            json={"refresh_token": buyer_refresh},
        )
        buyer_headers = {"Authorization": f"Bearer {refreshed.json()['access_token']}"}
        buyer_refresh = refreshed.json()["refresh_token"]

        await call("GET", "/api/v1/users/me", headers=seller_headers)
        await call(
            "PATCH",
            "/api/v1/users/me",
            headers=seller_headers,
            json={"username": f"seller_updated_{suffix}"},
        )
        await call("GET", f"/api/v1/users/{seller['id']}")
        uploaded_avatar = await call(
            "POST",
            "/api/v1/users/me/avatar",
            headers=seller_headers,
            files={"file": ("avatar.png", avatar_bytes(), "image/png")},
        )
        await call("GET", uploaded_avatar.json()["avatar_url"])
        await call("DELETE", "/api/v1/users/me/avatar", expected=204, headers=seller_headers)

        await call("GET", "/api/v1/listings")
        listing_response = await call(
            "POST",
            "/api/v1/listings",
            expected=201,
            headers=seller_headers,
            json={
                "title": "Smoke test service",
                "description": "Complete marketplace smoke test service",
                "category": "testing",
                "price_minor": 250000,
                "currency": "RUB",
                "delivery_days": 2,
            },
        )
        listing = listing_response.json()
        await call("GET", f"/api/v1/listings/{listing['id']}")
        updated_listing = await call(
            "PATCH",
            f"/api/v1/listings/{listing['id']}",
            headers=seller_headers,
            json={"price_minor": 275000},
        )
        assert updated_listing.json()["price_minor"] == 275000
        await call("GET", "/api/v1/listings", params={"q": "smoke", "category": "testing"})

        order_response = await call(
            "POST",
            "/api/v1/orders",
            expected=201,
            headers=buyer_headers,
            json={"listing_id": listing["id"], "requirements": "Run the complete order flow"},
        )
        order = order_response.json()
        await call("GET", "/api/v1/orders", headers=buyer_headers)
        await call("GET", f"/api/v1/orders/{order['id']}", headers=seller_headers)
        edited = await call(
            "PATCH",
            f"/api/v1/orders/{order['id']}",
            headers=buyer_headers,
            json={"requirements": "Updated smoke requirements", "version": order["version"]},
        )
        order = edited.json()

        order_conversation = await call(
            "POST",
            "/api/v1/chats",
            expected=201,
            headers=buyer_headers,
            json={"order_id": order["id"]},
        )
        conversation = order_conversation.json()
        await call("GET", "/api/v1/chats", headers=buyer_headers)
        await call("GET", f"/api/v1/chats/{conversation['id']}", headers=seller_headers)
        message_response = await call(
            "POST",
            f"/api/v1/chats/{conversation['id']}/messages",
            expected=201,
            headers=seller_headers,
            json={"body": "Smoke message"},
        )
        message = message_response.json()
        await call(
            "GET",
            f"/api/v1/chats/{conversation['id']}/messages",
            headers=buyer_headers,
        )
        await call(
            "PATCH",
            f"/api/v1/chats/{conversation['id']}/messages/{message['id']}",
            headers=seller_headers,
            json={"body": "Edited smoke message"},
        )
        await call(
            "POST",
            f"/api/v1/chats/{conversation['id']}/read",
            headers=buyer_headers,
        )
        await call(
            "DELETE",
            f"/api/v1/chats/{conversation['id']}/messages/{message['id']}",
            expected=204,
            headers=seller_headers,
        )

        direct = await call(
            "POST",
            "/api/v1/chats",
            expected=201,
            headers=buyer_headers,
            json={"recipient_id": outsider["id"]},
        )
        await call("GET", f"/api/v1/chats/{direct.json()['id']}", headers=outsider_headers)

        for actor_headers, next_status in (
            (seller_headers, "accepted"),
            (seller_headers, "in_progress"),
            (seller_headers, "delivered"),
            (buyer_headers, "completed"),
        ):
            changed = await call(
                "POST",
                f"/api/v1/orders/{order['id']}/status",
                headers=actor_headers,
                json={"status": next_status, "version": order["version"]},
            )
            order = changed.json()
        await call("DELETE", f"/api/v1/orders/{order['id']}", expected=204, headers=buyer_headers)

        cancellable = await call(
            "POST",
            "/api/v1/orders",
            expected=201,
            headers=outsider_headers,
            json={"listing_id": listing["id"], "requirements": "Order to cancel"},
        )
        await call(
            "DELETE",
            f"/api/v1/orders/{cancellable.json()['id']}",
            expected=204,
            headers=outsider_headers,
        )
        await call(
            "DELETE", f"/api/v1/listings/{listing['id']}", expected=204, headers=seller_headers
        )

        for refresh_token in (seller_refresh, buyer_refresh, outsider_refresh):
            await call(
                "POST",
                "/api/v1/auth/logout",
                expected=204,
                json={"refresh_token": refresh_token},
            )

    print(f"SMOKE TEST PASSED: {len(results)} requests")
    print("\n".join(results))


if __name__ == "__main__":
    asyncio.run(main())
