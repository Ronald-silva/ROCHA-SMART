from __future__ import annotations

from decimal import Decimal
from typing import Any

import httpx

from app.config import Settings, get_settings
from app.services.suppliers.base import SupplierConnector, SupplierProductSnapshot


class AliExpressConnector(SupplierConnector):
    name = "aliexpress"

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    async def health(self) -> dict[str, Any]:
        ok = bool(self._settings.aliexpress_api_base and self._settings.aliexpress_api_key)
        return {
            "provider": self.name,
            "configured": ok,
            "base": self._settings.aliexpress_api_base,
        }

    async def fetch_skus(self, skus: list[str]) -> list[SupplierProductSnapshot]:
        base = self._settings.aliexpress_api_base
        key = self._settings.aliexpress_api_key
        if not base or not key:
            return [
                SupplierProductSnapshot(
                    sku=s,
                    title=None,
                    stock_quantity=0,
                    price=None,
                    currency="BRL",
                    raw={"note": "AliExpress API não configurada (ALIEXPRESS_API_BASE / ALIEXPRESS_API_KEY)."},
                )
                for s in skus
            ]

        headers = {"Authorization": f"Bearer {key}", "Accept": "application/json"}
        out: list[SupplierProductSnapshot] = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            for sku in skus:
                url = f"{base.rstrip('/')}/sku/{sku}"
                try:
                    r = await client.get(url, headers=headers)
                    data = r.json() if r.content else {}
                    out.append(self._normalize(sku, data))
                except (httpx.HTTPError, ValueError) as e:
                    out.append(
                        SupplierProductSnapshot(
                            sku=sku,
                            title=None,
                            stock_quantity=0,
                            price=None,
                            currency="BRL",
                            raw={"error": str(e)},
                        )
                    )
        return out

    def _normalize(self, sku: str, data: dict[str, Any]) -> SupplierProductSnapshot:
        stock = int(data.get("total_avail_quantity") or data.get("stock") or 0)
        price_raw = data.get("sale_price") or data.get("price")
        price = Decimal(str(price_raw)) if price_raw is not None else None
        return SupplierProductSnapshot(
            sku=sku,
            title=data.get("product_title") or data.get("title"),
            stock_quantity=stock,
            price=price,
            currency=str(data.get("currency_code") or "BRL"),
            raw=data,
        )
