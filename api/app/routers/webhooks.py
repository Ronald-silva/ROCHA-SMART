from __future__ import annotations

import secrets
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.crud import products as product_crud
from app.database import get_session
from app.schemas.webhook import SupplierInventoryWebhook

router = APIRouter()


class SupplierOrderWebhookBody(BaseModel):
    order_id: str | None = Field(default=None, alias="orderId")
    external_order_id: str | None = Field(default=None, alias="externalOrderId")
    status: str

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def one_identifier(self) -> SupplierOrderWebhookBody:
        if not self.order_id and not self.external_order_id:
            raise ValueError("Informe orderId ou externalOrderId")
        return self


def _verify_supplier_secret(provider: str, header_secret: str | None) -> None:
    s = get_settings()
    expected = {
        "zendrop": s.webhook_secret_zendrop,
        "aliexpress": s.webhook_secret_aliexpress,
        "generic": s.webhook_secret_generic,
    }.get(provider.lower().strip())
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Segredo de webhook não configurado para este fornecedor",
        )
    if header_secret is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cabeçalho X-Webhook-Secret ausente")
    if len(header_secret) != len(expected) or not secrets.compare_digest(header_secret, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Segredo inválido")


@router.post("/suppliers/{provider}/orders")
async def webhook_order_status(
    provider: str,
    body: SupplierOrderWebhookBody,
    session: Annotated[AsyncSession, Depends(get_session)],
    x_webhook_secret: Annotated[str | None, Header(alias="X-Webhook-Secret")] = None,
) -> Response:
    """Atualização de status de pedido enviada pelo fornecedor (tempo real)."""

    _verify_supplier_secret(provider, x_webhook_secret)
    order_id = body.order_id or body.external_order_id
    assert order_id
    ok = await product_crud.update_order_status(session, order_id, body.status)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/suppliers/{provider}/inventory")
async def webhook_inventory(
    provider: str,
    body: SupplierInventoryWebhook,
    session: Annotated[AsyncSession, Depends(get_session)],
    x_webhook_secret: Annotated[str | None, Header(alias="X-Webhook-Secret")] = None,
) -> Response:
    """Mudanças de estoque/preço propagadas pelo fornecedor."""

    _verify_supplier_secret(provider, x_webhook_secret)
    price_dec: Decimal | None
    if body.price is None:
        price_dec = None
    else:
        price_dec = Decimal(str(body.price))
    row = await product_crud.patch_product_stock_price(
        session, sku=body.sku, stock_quantity=body.stock_quantity, price=price_dec
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto (SKU) não encontrado")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
