from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import products as product_crud
from app.database import get_session
from app.dependencies import get_current_subject
from app.schemas.product import ProductCreate, ProductRead, product_to_read
from app.services.analytics import SalesAnalytics, get_sales_analytics

router = APIRouter(tags=["ai-mcp"], dependencies=[Depends(get_current_subject)])


@router.post("/products/create", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def ai_create_product(
    session: Annotated[AsyncSession, Depends(get_session)],
    body: ProductCreate,
) -> ProductRead:
    """Endpoint dedicado para agentes (ex.: Claude via MCP) criarem produtos."""

    try:
        row = await product_crud.create_product(session, body)
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU duplicado ou conflito de integridade")
    return product_to_read(row)


@router.get("/analytics/sales", response_model=SalesAnalytics)
async def ai_sales_analytics(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SalesAnalytics:
    """Resumo de vendas para agentes de IA e dashboards."""

    return await get_sales_analytics(session)
