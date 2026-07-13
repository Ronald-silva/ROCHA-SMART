from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field, field_validator


class SmartHomeSpec(BaseModel):
    """Especificações técnicas persistidas em `ai_metadata` (casa inteligente)."""

    voltage: str | None = Field(default=None, description="Ex.: 110V, 220V, bivolt")
    connectivity: list[str] = Field(default_factory=list, description="Ex.: Wi‑Fi, Zigbee, Thread")
    protocols: list[str] = Field(default_factory=list, description="Ex.: Matter, Z-Wave, Tuya")
    extra: dict[str, Any] = Field(default_factory=dict)


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    sku: str | None = None
    price: Decimal = Field(ge=Decimal("0"))
    stock_quantity: int = Field(default=0, ge=0)
    image_url: str | None = None
    brand: str | None = "Rocha Smart"
    affiliate_url: str | None = Field(
        default=None,
        pattern=r"^https?://",
        description="URL do checkout oficial/parceiro usada pelo CTA da ficha.",
    )
    smart_specs: SmartHomeSpec = Field(default_factory=SmartHomeSpec)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    sku: str | None = None
    price: Decimal | None = Field(default=None, ge=Decimal("0"))
    stock_quantity: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    brand: str | None = None
    affiliate_url: str | None = Field(default=None, pattern=r"^https?://")
    smart_specs: SmartHomeSpec | None = None


class ProductRead(BaseModel):
    id: str
    name: str
    description: str | None
    sku: str | None
    price: Decimal
    stock_quantity: int
    image_url: str | None
    brand: str | None
    ai_metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": False}

    @field_validator("ai_metadata", mode="before")
    @classmethod
    def ensure_dict(cls, v: Any) -> dict[str, Any]:
        if v is None:
            return {}
        if isinstance(v, dict):
            return v
        return dict(v)


def merge_smart_specs_into_metadata(
    base: dict[str, Any] | None,
    spec: SmartHomeSpec | None,
) -> dict[str, Any]:
    out: dict[str, Any] = dict(base or {})
    if spec is None:
        return out
    data = spec.model_dump(exclude_none=True)
    extra = data.pop("extra", {}) or {}
    cur = out.get("smart_home")
    if not isinstance(cur, dict):
        cur = {}
    for k, v in data.items():
        if v is None or v == []:
            continue
        cur[k] = v
    if isinstance(extra, dict):
        cur.update(extra)
    out["smart_home"] = cur
    return out


def merge_affiliate_url_into_metadata(
    base: dict[str, Any] | None,
    affiliate_url: str | None,
) -> dict[str, Any]:
    """Mantém o contrato comercial no JSON compartilhado com o frontend Prisma."""
    out: dict[str, Any] = dict(base or {})
    affiliate = out.get("affiliate")
    block = dict(affiliate) if isinstance(affiliate, dict) else {}
    if affiliate_url:
        block["checkout_url"] = affiliate_url
        out["affiliate"] = block
    else:
        block.pop("checkout_url", None)
        if block:
            out["affiliate"] = block
        else:
            out.pop("affiliate", None)
    return out


def product_to_read(p: Any) -> ProductRead:
    return ProductRead(
        id=p.id,
        name=p.name,
        description=p.description,
        sku=p.sku,
        price=p.price,
        stock_quantity=p.stockQuantity,
        image_url=p.imageUrl,
        brand=p.brand,
        ai_metadata=p.ai_metadata or {},
        created_at=p.createdAt,
        updated_at=p.updatedAt,
    )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
