from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import products as product_crud
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
    snapshots = await conn.fetch_skus(skus)
    health = await conn.health()
    return {
        "provider": provider,
        "health": health,
        "items": [
            {
                "sku": s.sku,
                "title": s.title,
                "stock_quantity": s.stock_quantity,
                "price": str(s.price) if s.price is not None else None,
                "currency": s.currency,
            }
            for s in snapshots
        ],
    }


async def sync_products_persist(session: AsyncSession, provider: str, skus: list[str]) -> dict:
    conn = get_connector(provider)
    snapshots = await conn.fetch_skus(skus)
    updated = 0
    missing = 0
    for s in snapshots:
        row = await product_crud.patch_product_stock_price(
            session,
            sku=s.sku,
            stock_quantity=s.stock_quantity,
            price=s.price,
        )
        if row:
            updated += 1
        else:
            missing += 1
    return {"provider": provider, "updated": updated, "missing_skus": missing, "processed": len(snapshots)}
