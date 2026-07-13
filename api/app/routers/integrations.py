from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.dependencies import get_current_subject
from app.services.suppliers.aliexpress import AliExpressConnector
from app.services.suppliers.sync import get_connector, sync_products_preview, sync_products_persist
from app.services.suppliers.zendrop import ZendropConnector

router = APIRouter(prefix="/api", dependencies=[Depends(get_current_subject)])


class SupplierSyncRequest(BaseModel):
    skus: list[str] = Field(min_length=1, max_length=500)


@router.get("/integrations/suppliers")
async def suppliers_status() -> dict:
    z = ZendropConnector()
    a = AliExpressConnector()
    return {
        "suppliers": [
            await z.health(),
            await a.health(),
        ],
    }


@router.post("/suppliers/sync/{provider}")
async def suppliers_sync(
    provider: str,
    body: SupplierSyncRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    persist: bool = False,
) -> dict:
    try:
        get_connector(provider)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fornecedor inválido")
    if persist:
        try:
            return await sync_products_persist(session, provider, body.skus)
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Persistência recusada por proteção de sincronização") from exc
    return await sync_products_preview(provider, body.skus)
