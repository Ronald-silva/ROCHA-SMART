from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class SupplierProductSnapshot:
    sku: str
    title: str | None
    stock_quantity: int
    price: Decimal | None
    currency: str
    raw: dict[str, Any]


class SupplierConnector(ABC):
    """Contrato para integrações de dropshipping (estoque/preço)."""

    name: str

    @abstractmethod
    async def fetch_skus(self, skus: list[str]) -> list[SupplierProductSnapshot]:
        """Consulta remota por SKU (implementação real chama HTTP da plataforma)."""

    @abstractmethod
    async def health(self) -> dict[str, Any]:
        """Diagnóstico de credenciais/base URL sem expor segredos."""
