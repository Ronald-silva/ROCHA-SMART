from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(alias="DATABASE_URL")

    jwt_secret_key: str = Field(default="dev-change-me", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60 * 24, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # JSON map: {"frontend":"secret","ai-agent":"secret2"}
    auth_clients_json: str = Field(
        default='{"frontend":"dev-frontend","ai-agent":"dev-ai"}',
        alias="AUTH_CLIENTS_JSON",
    )

    catalog_site_url: str = Field(default="http://localhost:3000", alias="CATALOG_SITE_URL")
    catalog_feed_token: str | None = Field(default=None, alias="CATALOG_FEED_TOKEN")

    zendrop_api_base: str | None = Field(default=None, alias="ZENDROP_API_BASE")
    zendrop_api_key: str | None = Field(default=None, alias="ZENDROP_API_KEY")
    aliexpress_api_base: str | None = Field(default=None, alias="ALIEXPRESS_API_BASE")
    aliexpress_api_key: str | None = Field(default=None, alias="ALIEXPRESS_API_KEY")

    webhook_secret_zendrop: str | None = Field(default=None, alias="WEBHOOK_SECRET_ZENDROP")
    webhook_secret_aliexpress: str | None = Field(default=None, alias="WEBHOOK_SECRET_ALIEXPRESS")
    webhook_secret_generic: str | None = Field(default=None, alias="WEBHOOK_SECRET_GENERIC")

    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")

    database_ssl: bool = Field(default=False, alias="DATABASE_SSL")

    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    sdr_model: str = Field(default="claude-3-5-haiku-latest", alias="SDR_MODEL")

    @field_validator("auth_clients_json", mode="before")
    @classmethod
    def strip_clients(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v

    def auth_clients(self) -> dict[str, str]:
        import json

        try:
            data = json.loads(self.auth_clients_json)
        except json.JSONDecodeError:
            return {}
        if not isinstance(data, dict):
            return {}
        return {str(k): str(v) for k, v in data.items()}

    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
