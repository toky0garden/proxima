from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Proxima API"
    environment: Literal["development", "test", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    docs_enabled: bool = True

    database_url: str
    database_url_unpooled: str | None = None
    use_sqlite_for_development: bool = True
    jwt_secret_key: str = Field(min_length=32)
    jwt_refresh_secret_key: str = Field(min_length=32)
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    access_token_expire_minutes: int = Field(default=15, ge=1, le=60)
    refresh_token_expire_days: int = Field(default=30, ge=1, le=90)
    jwt_issuer: str = "proxima-api"
    jwt_audience: str = "proxima-client"

    @model_validator(mode="after")
    def select_development_database(self):
        if self.environment == "development" and self.use_sqlite_for_development:
            database_path = (PROJECT_ROOT / "proxima.db").as_posix()
            self.database_url = f"sqlite+aiosqlite:///{database_path}"
        elif self.database_url_unpooled:
            self.database_url = self.database_url_unpooled

        if self.database_url.startswith(("postgres://", "postgresql://")):
            parsed = urlsplit(self.database_url)
            query = dict(parse_qsl(parsed.query, keep_blank_values=True))
            ssl_mode = query.pop("sslmode", None)
            query.pop("channel_binding", None)
            if ssl_mode:
                query["ssl"] = ssl_mode
            self.database_url = urlunsplit(
                (
                    "postgresql+asyncpg",
                    parsed.netloc,
                    parsed.path,
                    urlencode(query),
                    parsed.fragment,
                )
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
