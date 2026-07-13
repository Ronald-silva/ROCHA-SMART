from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "Product"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    sku: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    stockQuantity: Mapped[int] = mapped_column("stockQuantity", Integer, default=0)
    imageUrl: Mapped[str | None] = mapped_column("imageUrl", String, nullable=True)
    brand: Mapped[str | None] = mapped_column("brand", String, nullable=True)
    ai_metadata: Mapped[dict[str, Any]] = mapped_column("ai_metadata", JSONB, default=dict)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False))


class Partner(Base):
    __tablename__ = "Partner"
    __table_args__ = (CheckConstraint("status IN ('active', 'inactive')", name="Partner_status"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, unique=True)
    allowedDomains: Mapped[list[str]] = mapped_column("allowedDomains", ARRAY(String))
    status: Mapped[str] = mapped_column(String, default="active")
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False))


class Merchant(Base):
    __tablename__ = "Merchant"
    __table_args__ = (UniqueConstraint("partnerId", "slug", name="Merchant_partnerId_slug_key"), CheckConstraint("status IN ('active', 'inactive')", name="Merchant_status"))

    id: Mapped[str] = mapped_column(String, primary_key=True)
    partnerId: Mapped[str] = mapped_column("partnerId", ForeignKey("Partner.id"), nullable=False)
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String)
    domain: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[str] = mapped_column(String, default="active")
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False))


class Offer(Base):
    __tablename__ = "Offer"
    __table_args__ = (
        CheckConstraint('price >= 0', name="Offer_price_positive"), CheckConstraint('"validUntil" > "verifiedAt"', name="Offer_valid_window"),
        CheckConstraint("\"destinationType\" IN ('manufacturer','official_store','marketplace','third_party_seller')", name="Offer_destination_type"),
        CheckConstraint("\"commercialRelationship\" IN ('affiliate','sponsored','editorial')", name="Offer_commercial_relationship"),
        CheckConstraint("availability IN ('in_stock','preorder','out_of_stock','unknown')", name="Offer_availability"),
        CheckConstraint("status IN ('draft','active','paused','expired')", name="Offer_status"),
        Index("Offer_productId_status_validUntil_idx", "productId", "status", "validUntil"), Index("Offer_partnerId_idx", "partnerId"), Index("Offer_merchantId_idx", "merchantId"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    productId: Mapped[str] = mapped_column("productId", ForeignKey("Product.id"), nullable=False)
    partnerId: Mapped[str] = mapped_column("partnerId", ForeignKey("Partner.id"), nullable=False)
    merchantId: Mapped[str] = mapped_column("merchantId", ForeignKey("Merchant.id"), nullable=False)
    seller: Mapped[str | None] = mapped_column(String, nullable=True)
    destinationUrl: Mapped[str] = mapped_column("destinationUrl", String)
    destinationType: Mapped[str] = mapped_column("destinationType", String)
    commercialRelationship: Mapped[str] = mapped_column("commercialRelationship", String)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String, default="BRL")
    availability: Mapped[str] = mapped_column(String)
    verificationSource: Mapped[str] = mapped_column("verificationSource", String)
    verifiedAt: Mapped[datetime] = mapped_column("verifiedAt", DateTime(timezone=False))
    validUntil: Mapped[datetime] = mapped_column("validUntil", DateTime(timezone=False))
    status: Mapped[str] = mapped_column(String, default="active")
    affiliateMetadata: Mapped[dict[str, Any]] = mapped_column("affiliateMetadata", JSONB, default=dict)
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False))


class PriceSnapshot(Base):
    __tablename__ = "PriceSnapshot"
    __table_args__ = (CheckConstraint("price >= 0", name="PriceSnapshot_price_positive"), Index("PriceSnapshot_offerId_capturedAt_idx", "offerId", "capturedAt"))

    id: Mapped[str] = mapped_column(String, primary_key=True)
    offerId: Mapped[str] = mapped_column("offerId", ForeignKey("Offer.id"), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String)
    availability: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String)
    capturedAt: Mapped[datetime] = mapped_column("capturedAt", DateTime(timezone=False))


class SdrUsageBucket(Base):
    __tablename__ = "SdrUsageBucket"
    __table_args__ = (Index("SdrUsageBucket_expiresAt_idx", "expiresAt"),)

    subjectHash: Mapped[str] = mapped_column("subjectHash", String, primary_key=True)
    subjectKind: Mapped[str] = mapped_column("subjectKind", String, primary_key=True)
    windowKind: Mapped[str] = mapped_column("windowKind", String, primary_key=True)
    windowStart: Mapped[datetime] = mapped_column("windowStart", DateTime(timezone=False), primary_key=True)
    requestCount: Mapped[int] = mapped_column("requestCount", Integer, default=0)
    tokenCount: Mapped[int] = mapped_column("tokenCount", BigInteger, default=0)
    costUsd: Mapped[Decimal] = mapped_column("costUsd", Numeric(14, 8), default=0)
    expiresAt: Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=False))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False))


class Order(Base):
    __tablename__ = "Order"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=False))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=False))


class OrderItem(Base):
    __tablename__ = "OrderItem"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    orderId: Mapped[str] = mapped_column("orderId", ForeignKey("Order.id", ondelete="CASCADE"), nullable=False)
    productId: Mapped[str] = mapped_column("productId", ForeignKey("Product.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unitPrice: Mapped[Decimal] = mapped_column("unitPrice", Numeric(12, 2))

    __table_args__ = (UniqueConstraint("orderId", "productId", name="OrderItem_orderId_productId_key"),)
