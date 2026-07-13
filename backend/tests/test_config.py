from app.core.config import Settings


def test_production_neon_url_is_normalized_for_asyncpg() -> None:
    settings = Settings(
        environment="production",
        database_url=(
            "postgresql://user:password@example.neon.tech/db"
            "?sslmode=require&channel_binding=require"
        ),
        jwt_secret_key="a" * 32,
        jwt_refresh_secret_key="b" * 32,
    )

    assert settings.database_url.startswith("postgresql+asyncpg://")
    assert "ssl=require" in settings.database_url
    assert "sslmode" not in settings.database_url
    assert "channel_binding" not in settings.database_url


def test_unpooled_database_url_takes_priority_in_production() -> None:
    settings = Settings(
        environment="production",
        database_url="postgresql://pooled.example/db",
        database_url_unpooled="postgresql://direct.example/db?sslmode=require",
        jwt_secret_key="a" * 32,
        jwt_refresh_secret_key="b" * 32,
    )

    assert "direct.example" in settings.database_url
