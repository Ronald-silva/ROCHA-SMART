from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import products as product_crud
from app.database import get_session
from app.dependencies import CurrentSubject
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate, product_to_read

router = APIRouter()


@router.get("", response_model=list[ProductRead])
async def list_products(
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sku: str | None = Query(None, description="Filtra por SKU exato"),
) -> list[ProductRead]:
    rows = await product_crud.list_products(session, skip=skip, limit=limit, sku=sku)
    return [product_to_read(p) for p in rows]


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
    body: ProductCreate,
) -> ProductRead:
    try:
        row = await product_crud.create_product(session, body)
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU duplicado ou conflito de integridade")
    return product_to_read(row)


@router.get("/{product_id}", response_model=ProductRead)
async def read_product(
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
    product_id: str,
) -> ProductRead:
    row = await product_crud.get_product(session, product_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return product_to_read(row)


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
    product_id: str,
    body: ProductUpdate,
) -> ProductRead:
    try:
        row = await product_crud.update_product(session, product_id, body)
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU duplicado ou conflito de integridade")
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return product_to_read(row)


@router.delete("/{product_id}")
async def remove_product(
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
    product_id: str,
) -> Response:
    ok = await product_crud.delete_product(session, product_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
