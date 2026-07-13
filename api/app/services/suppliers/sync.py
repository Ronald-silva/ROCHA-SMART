from __future__ import annotations

from decimal import Decimal, InvalidOperation
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Product
from app.services.suppliers.aliexpress import AliExpressConnector
from app.services.suppliers.base import SupplierConnector
from app.services.suppliers.zendrop import ZendropConnector


def get_connector(name: str) -> SupplierConnector:
    key = name.lower().strip()
    if key in ("zendrop",):
        return ZendropConnector()
    if key in ("aliexpress", "ali"):
        return AliExpressConnector()
    raise KeyError(f"Fornecedor desconhecido: {name}")


async def sync_products_preview(provider: str, skus: list[str]) -> dict:
    conn = get_connector(provider)
    health = await conn.health()
    if not health.get("configured"):
        return {"provider": provider, "health": health, "mode": "dry-run", "changed": 0, "items": [], "evaluated": 0}
    snapshots = await conn.fetch_skus(skus)
    return {
        "provider": provider,
        "health": health,
        "mode": "dry-run", "changed": 0,
        "items": [
            {
                "sku": s.sku,
                "title": s.title,
                "stock_quantity": s.stock_quantity,
                "price": str(s.price) if s.price is not None else None,
                "currency": s.currency,
                "complete": s.complete,
                "error": s.error,
            }
            for s in snapshots
        ],
    }


async def sync_products_persist(session: AsyncSession, provider: str, skus: list[str]) -> dict:
    conn = get_connector(provider)
    health = await conn.health()
    if not health.get("configured"):
        raise RuntimeError("supplier_not_configured")
    snapshots = await conn.fetch_skus(skus)
    if not snapshots:
        return {"provider": provider, "mode": "persist", "updated": 0, "changed": 0, "skipped": 0, "missing_skus": 0, "processed": 0}
    settings = get_settings()
    candidates: list[tuple[Product, int, Decimal]] = []
    missing = 0
    skipped = 0
    blocked = 0
    for s in snapshots:
        if not s.complete or s.error or s.stock_quantity is None or s.price is None:
            skipped += 1
            continue
        try:
            price = Decimal(s.price)
        except (InvalidOperation, TypeError):
            skipped += 1
            continue
        if s.stock_quantity < 0 or price <= 0 or s.currency.upper() != "BRL":
            blocked += 1
            continue
        row = (await session.execute(select(Product).where(Product.sku == s.sku))).scalar_one_or_none()
        if row is None:
            missing += 1
            continue
        old_price = Decimal(row.price)
        price_change = abs(price - old_price) / old_price * 100 if old_price > 0 else Decimal("100")
        if price_change > Decimal(str(settings.supplier_sync_max_price_change_pct)):
            blocked += 1
            logging.warning("supplier_sync_anomaly", extra={"provider": provider, "sku": s.sku, "price_change_pct": str(price_change)})
            continue
        if abs(s.stock_quantity - row.stockQuantity) > settings.supplier_sync_max_stock_delta:
            blocked += 1
            logging.warning("supplier_sync_stock_anomaly", extra={"provider": provider, "sku": s.sku})
            continue
        if row.stockQuantity != s.stock_quantity or old_price != price:
            candidates.append((row, s.stock_quantity, price))
    if len(candidates) > settings.supplier_sync_max_changes:
        await session.rollback()
        raise RuntimeError("supplier_change_limit_exceeded")
    try:
        for row, stock, price in candidates:
            row.stockQuantity = stock
            row.price = price
        await session.commit()
    except Exception:
        await session.rollback()
        logging.exception("supplier_sync_rollback", extra={"provider": provider})
        raise
    return {"provider": provider, "mode": "persist", "updated": len(candidates), "changed": len(candidates), "persisted": len(candidates), "skipped": skipped, "ignored": skipped + missing, "blocked": blocked, "missing_skus": missing, "processed": len(snapshots), "evaluated": len(snapshots)}
