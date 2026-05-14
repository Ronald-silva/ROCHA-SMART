from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
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
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True))


class Order(Base):
    __tablename__ = "Order"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    status: Mapped[str] = mapped_column(String, default="pending")
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    createdAt: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True))
    updatedAt: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True))


class OrderItem(Base):
    __tablename__ = "OrderItem"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    orderId: Mapped[str] = mapped_column("orderId", String, nullable=False)
    productId: Mapped[str] = mapped_column("productId", String, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unitPrice: Mapped[Decimal] = mapped_column("unitPrice", Numeric(12, 2))
