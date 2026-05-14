from typing import Any

from pydantic import BaseModel, Field


class SupplierOrderWebhook(BaseModel):
    """Payload genérico para atualização de status de pedido."""

    external_order_id: str = Field(alias="externalOrderId")
    status: str
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class SupplierInventoryWebhook(BaseModel):
    """Atualização de estoque/preço vinda do fornecedor."""

    sku: str
    stock_quantity: int = Field(alias="stockQuantity", ge=0)
    price: str | float | None = None
    currency: str | None = "BRL"

    model_config = {"populate_by_name": True}
