from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, Product
from app.schemas.product import ProductCreate, ProductUpdate, merge_smart_specs_into_metadata, now_utc
from cuid2 import cuid_wrapper

_cuid = cuid_wrapper()


async def create_product(session: AsyncSession, data: ProductCreate) -> Product:
    pid = _cuid()
    ts = now_utc()
    meta = merge_smart_specs_into_metadata({}, data.smart_specs)
    row = Product(
        id=pid,
        name=data.name,
        description=data.description,
        sku=data.sku,
        price=data.price,
        stockQuantity=data.stock_quantity,
        imageUrl=data.image_url,
        brand=data.brand,
        ai_metadata=meta,
        createdAt=ts,
        updatedAt=ts,
    )
    session.add(row)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(row)
    return row


async def get_product(session: AsyncSession, product_id: str) -> Product | None:
    return await session.get(Product, product_id)


async def get_product_by_sku(session: AsyncSession, sku: str) -> Product | None:
    res = await session.execute(select(Product).where(Product.sku == sku))
    return res.scalar_one_or_none()


async def list_products(
    session: AsyncSession, *, skip: int = 0, limit: int = 50, sku: str | None = None
) -> list[Product]:
    q = select(Product).order_by(Product.createdAt.desc())
    if sku:
        q = q.where(Product.sku == sku)
    res = await session.execute(q.offset(skip).limit(min(limit, 200)))
    return list(res.scalars().all())


async def update_product(session: AsyncSession, product_id: str, data: ProductUpdate) -> Product | None:
    row = await get_product(session, product_id)
    if row is None:
        return None
    ts = now_utc()
    if data.name is not None:
        row.name = data.name
    if data.description is not None:
        row.description = data.description
    if data.sku is not None:
        row.sku = data.sku
    if data.price is not None:
        row.price = data.price
    if data.stock_quantity is not None:
        row.stockQuantity = data.stock_quantity
    if data.image_url is not None:
        row.imageUrl = data.image_url
    if data.brand is not None:
        row.brand = data.brand
    if data.smart_specs is not None:
        row.ai_metadata = merge_smart_specs_into_metadata(row.ai_metadata, data.smart_specs)
    row.updatedAt = ts
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(row)
    return row


async def delete_product(session: AsyncSession, product_id: str) -> bool:
    row = await get_product(session, product_id)
    if row is None:
        return False
    await session.delete(row)
    await session.commit()
    return True


async def patch_product_stock_price(
    session: AsyncSession,
    *,
    sku: str,
    stock_quantity: int,
    price=None,
) -> Product | None:
    row = await get_product_by_sku(session, sku)
    if row is None:
        return None
    row.stockQuantity = stock_quantity
    if price is not None:
        row.price = price
    row.updatedAt = now_utc()
    await session.commit()
    await session.refresh(row)
    return row


async def update_order_status(session: AsyncSession, order_id: str, status: str) -> bool:
    res = await session.execute(update(Order).where(Order.id == order_id).values(status=status, updatedAt=now_utc()))
    await session.commit()
    return res.rowcount > 0  # type: ignore[union-attr]
