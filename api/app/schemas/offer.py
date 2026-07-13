from datetime import datetime, timezone
from decimal import Decimal
from enum import StrEnum
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, model_validator


class DestinationType(StrEnum):
    MANUFACTURER = "manufacturer"
    OFFICIAL_STORE = "official_store"
    MARKETPLACE = "marketplace"
    THIRD_PARTY_SELLER = "third_party_seller"


class CommercialRelationship(StrEnum):
    AFFILIATE = "affiliate"
    SPONSORED = "sponsored"
    EDITORIAL = "editorial"


class Availability(StrEnum):
    IN_STOCK = "in_stock"
    PREORDER = "preorder"
    OUT_OF_STOCK = "out_of_stock"
    UNKNOWN = "unknown"


class OfferStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    EXPIRED = "expired"


def normalize_domain(value: str) -> str:
    domain = value.strip().lower().rstrip(".")
    if domain.startswith("www."):
        domain = domain[4:]
    if not domain or "/" in domain or ":" in domain:
        raise ValueError("domínio inválido")
    return domain


def domain_is_allowed(hostname: str, allowed_domains: list[str]) -> bool:
    host = normalize_domain(hostname)
    return any(host == domain or host.endswith(f".{domain}") for domain in map(normalize_domain, allowed_domains))


class OfferInput(BaseModel):
    destination_url: str
    destination_type: DestinationType
    commercial_relationship: CommercialRelationship
    seller: str | None = None
    price: Decimal = Field(gt=Decimal("0"), max_digits=12, decimal_places=2)
    currency: str = Field(default="BRL", min_length=3, max_length=3)
    availability: Availability
    verification_source: str = Field(min_length=1, max_length=500)
    verified_at: datetime
    valid_until: datetime
    status: OfferStatus = OfferStatus.DRAFT
    affiliate_identifier: str | None = Field(default=None, max_length=200)

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()

    @model_validator(mode="after")
    def validate_window_and_seller(self) -> "OfferInput":
        if self.verified_at.tzinfo is None or self.valid_until.tzinfo is None:
            raise ValueError("datas da oferta devem conter timezone")
        if self.valid_until <= self.verified_at:
            raise ValueError("valid_until deve ser posterior a verified_at")
        if self.destination_type == DestinationType.THIRD_PARTY_SELLER and not self.seller:
            raise ValueError("seller é obrigatório para vendedor terceiro")
        return self

    def validate_destination(self, *, allowed_domains: list[str], production: bool) -> None:
        parsed = urlparse(self.destination_url)
        if parsed.scheme not in ({"https"} if production else {"http", "https"}):
            raise ValueError("a URL da oferta deve usar HTTPS em produção")
        if not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("URL de destino inválida")
        if not domain_is_allowed(parsed.hostname, allowed_domains):
            raise ValueError("domínio de destino não aprovado")

    def is_publicly_actionable(self, now: datetime | None = None) -> bool:
        current = now or datetime.now(timezone.utc)
        return (
            self.status == OfferStatus.ACTIVE
            and self.availability in {Availability.IN_STOCK, Availability.PREORDER}
            and self.verified_at <= current < self.valid_until
        )
