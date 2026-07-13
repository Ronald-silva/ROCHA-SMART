from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(alias="DATABASE_URL")
    app_env: str = Field(default="development", alias="APP_ENV")

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
    supplier_sync_max_changes: int = Field(default=50, ge=1, le=1000, alias="SUPPLIER_SYNC_MAX_CHANGES")
    supplier_sync_max_price_change_pct: float = Field(default=40, gt=0, le=100, alias="SUPPLIER_SYNC_MAX_PRICE_CHANGE_PCT")
    supplier_sync_max_stock_delta: int = Field(default=500, ge=1, alias="SUPPLIER_SYNC_MAX_STOCK_DELTA")
    sdr_enabled: bool = Field(default=True, alias="SDR_ENABLED")
    sdr_gateway_secret: str = Field(default="dev-sdr-gateway-secret", alias="SDR_GATEWAY_SECRET")
    sdr_rate_limit_per_minute: int = Field(default=5, ge=1, alias="SDR_RATE_LIMIT_PER_MINUTE")
    sdr_daily_quota: int = Field(default=30, ge=1, alias="SDR_DAILY_QUOTA")
    sdr_monthly_budget_usd: float = Field(default=20, gt=0, alias="SDR_MONTHLY_BUDGET_USD")
    sdr_max_message_chars: int = Field(default=2000, ge=100, le=8000, alias="SDR_MAX_MESSAGE_CHARS")
    sdr_max_history_messages: int = Field(default=6, ge=0, le=20, alias="SDR_MAX_HISTORY_MESSAGES")
    sdr_max_output_tokens: int = Field(default=700, ge=100, le=2048, alias="SDR_MAX_OUTPUT_TOKENS")
    sdr_max_tool_cycles: int = Field(default=2, ge=0, le=4, alias="SDR_MAX_TOOL_CYCLES")
    sdr_timeout_seconds: float = Field(default=20, gt=1, le=60, alias="SDR_TIMEOUT_SECONDS")
    sdr_usage_store: str = Field(default="memory", alias="SDR_USAGE_STORE")
    sdr_store_failure_policy: str = Field(default="closed", alias="SDR_STORE_FAILURE_POLICY")
    sdr_identity_hash_salt: str = Field(default="dev-identity-hash-salt", alias="SDR_IDENTITY_HASH_SALT")

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

    @model_validator(mode="after")
    def reject_insecure_production_defaults(self) -> "Settings":
        if self.app_env.lower() not in {"production", "prod"}:
            return self
        if self.jwt_secret_key == "dev-change-me" or len(self.jwt_secret_key) < 32:
            raise ValueError("JWT_SECRET_KEY deve ter pelo menos 32 caracteres em produção")
        if any(secret.startswith("dev-") for secret in self.auth_clients().values()):
            raise ValueError("AUTH_CLIENTS_JSON não pode usar credenciais de desenvolvimento em produção")
        if self.cors_origins.strip() == "*":
            raise ValueError("CORS_ORIGINS deve listar origens explícitas em produção")
        if len(self.sdr_gateway_secret) < 32:
            raise ValueError("SDR_GATEWAY_SECRET deve ter pelo menos 32 caracteres em produção")
        if self.sdr_usage_store != "postgres":
            raise ValueError("SDR_USAGE_STORE deve ser postgres em produção")
        if self.sdr_store_failure_policy != "closed":
            raise ValueError("SDR_STORE_FAILURE_POLICY deve ser closed em produção")
        if len(self.sdr_identity_hash_salt) < 32:
            raise ValueError("SDR_IDENTITY_HASH_SALT deve ter pelo menos 32 caracteres em produção")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
