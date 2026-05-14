from __future__ import annotations

from decimal import Decimal
from typing import Any

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order


class SalesByStatus(BaseModel):
    status: str
    orders: int
    revenue: Decimal


class SalesAnalytics(BaseModel):
    total_orders: int
    total_revenue: Decimal
    by_status: list[SalesByStatus]
    recent_orders: list[dict[str, Any]]


async def get_sales_analytics(session: AsyncSession, *, recent_limit: int = 10) -> SalesAnalytics:
    total_orders = int(await session.scalar(select(func.count()).select_from(Order)) or 0)
    total_revenue = await session.scalar(select(func.coalesce(func.sum(Order.total), 0)))
    if total_revenue is None:
        total_revenue = Decimal("0")

    grouped = await session.execute(
        select(
            Order.status,
            func.count().label("orders"),
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
        ).group_by(Order.status)
    )
    by_status = [SalesByStatus(status=r.status, orders=int(r.orders), revenue=Decimal(r.revenue)) for r in grouped.all()]

    recent_rows = await session.execute(select(Order).order_by(Order.createdAt.desc()).limit(recent_limit))
    recent_orders: list[dict[str, Any]] = []
    for o in recent_rows.scalars().all():
        recent_orders.append(
            {
                "id": o.id,
                "status": o.status,
                "total": str(o.total),
                "createdAt": o.createdAt.isoformat(),
            }
        )

    return SalesAnalytics(
        total_orders=total_orders,
        total_revenue=Decimal(total_revenue),
        by_status=by_status,
        recent_orders=recent_orders,
    )
