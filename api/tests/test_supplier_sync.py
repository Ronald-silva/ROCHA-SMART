from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
import asyncio

import pytest

from app.services.suppliers.base import SupplierProductSnapshot
from app.services.suppliers import sync


class Connector:
    def __init__(self, configured=True, items=None): self.configured, self.items = configured, items or []
    async def health(self): return {"configured": self.configured}
    async def fetch_skus(self, _skus): return self.items


def test_unconfigured_supplier_never_writes(monkeypatch):
    monkeypatch.setattr(sync, "get_connector", lambda _: Connector(False))
    session = AsyncMock()
    with pytest.raises(RuntimeError, match="supplier_not_configured"):
        asyncio.run(sync.sync_products_persist(session, "x", ["sku"]))
    session.commit.assert_not_awaited()


def test_empty_payload_is_noop(monkeypatch):
    monkeypatch.setattr(sync, "get_connector", lambda _: Connector(True, []))
    session = AsyncMock()
    result = asyncio.run(sync.sync_products_persist(session, "x", ["sku"]))
    assert result["updated"] == 0
    session.commit.assert_not_awaited()


def test_partial_and_invalid_payload_are_skipped(monkeypatch):
    items = [
        SupplierProductSnapshot("a", None, None, None, "BRL", {}, complete=False, error="timeout"),
        SupplierProductSnapshot("b", None, -1, Decimal("0"), "BRL", {}),
    ]
    monkeypatch.setattr(sync, "get_connector", lambda _: Connector(True, items))
    session = AsyncMock()
    result = asyncio.run(sync.sync_products_persist(session, "x", ["a", "b"]))
    assert result["skipped"] == 1
    assert result["blocked"] == 1
    session.commit.assert_awaited_once()


def test_rollback_on_commit_failure(monkeypatch):
    item = SupplierProductSnapshot("a", None, 2, Decimal("10"), "BRL", {})
    product = type("P", (), {"sku": "a", "stockQuantity": 1, "price": Decimal("10")})()
    scalar = MagicMock(); scalar.scalar_one_or_none.return_value = product
    session = AsyncMock(); session.execute.return_value = scalar; session.commit.side_effect = RuntimeError("db")
    monkeypatch.setattr(sync, "get_connector", lambda _: Connector(True, [item]))
    with pytest.raises(RuntimeError, match="db"):
        asyncio.run(sync.sync_products_persist(session, "x", ["a"]))
    session.rollback.assert_awaited_once()


def test_repeated_snapshot_is_idempotent(monkeypatch):
    item = SupplierProductSnapshot("a", None, 2, Decimal("10"), "BRL", {})
    product = type("P", (), {"sku": "a", "stockQuantity": 2, "price": Decimal("10")})()
    scalar = MagicMock(); scalar.scalar_one_or_none.return_value = product
    session = AsyncMock(); session.execute.return_value = scalar
    monkeypatch.setattr(sync, "get_connector", lambda _: Connector(True, [item]))
    result = asyncio.run(sync.sync_products_persist(session, "x", ["a"]))
    assert result["updated"] == 0


def test_timeout_never_writes(monkeypatch):
    connector = Connector(True)
    connector.fetch_skus = AsyncMock(side_effect=TimeoutError("timeout"))
    monkeypatch.setattr(sync, "get_connector", lambda _: connector)
    session = AsyncMock()
    with pytest.raises(TimeoutError): asyncio.run(sync.sync_products_persist(session, "x", ["a"]))
    session.commit.assert_not_awaited()
