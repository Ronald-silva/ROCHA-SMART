import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import os

import pytest
from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import Settings
from app.models import Partner, Product
from app.schemas.offer import OfferInput
from app.services.sdr_usage_store import PostgresSdrUsageStore, SdrUsageLimitError, UsageReservation
from app.services.suppliers import sync
from app.services.suppliers.base import SupplierProductSnapshot


pytestmark = pytest.mark.skipif(not os.getenv("TEST_DATABASE_URL"), reason="requires disposable PostgreSQL")


def run(coro): return asyncio.run(coro)


def resources():
    engine = create_async_engine(os.environ["TEST_DATABASE_URL"])
    return engine, async_sessionmaker(engine, expire_on_commit=False)


class Connector:
    def __init__(self, items): self.items = items
    async def health(self): return {"configured": True}
    async def fetch_skus(self, _): return self.items


def cfg(**values):
    return Settings(**{"DATABASE_URL": os.environ["TEST_DATABASE_URL"], "SDR_GATEWAY_SECRET": "x" * 32, **values})


def test_schema_introspection_and_cross_orm_write():
    async def scenario():
        engine, sessions = resources()
        async with engine.connect() as connection:
            tables = await connection.run_sync(lambda c: set(inspect(c).get_table_names()))
            assert {"Product", "Partner", "Merchant", "Offer", "PriceSnapshot", "SdrUsageBucket", "OutboundClick"}.issubset(tables)
            offer_columns = await connection.run_sync(lambda c: {x["name"]: x for x in inspect(c).get_columns("Offer")})
            assert offer_columns["price"]["nullable"] is False
            assert offer_columns["validUntil"]["nullable"] is False
            assert offer_columns["seller"]["nullable"] is True
            assert offer_columns["price"]["type"].precision == 12 and offer_columns["price"]["type"].scale == 2
            assert offer_columns["createdAt"]["type"].timezone is False
            assert offer_columns["status"]["default"] is not None
            usage_columns = await connection.run_sync(lambda c: {x["name"]: x for x in inspect(c).get_columns("SdrUsageBucket")})
            assert usage_columns["tokenCount"]["type"].__class__.__name__ == "BIGINT"
            assert usage_columns["costUsd"]["type"].precision == 14 and usage_columns["costUsd"]["type"].scale == 8
            indexes = await connection.run_sync(lambda c: {x["name"] for x in inspect(c).get_indexes("Offer")})
            assert {"Offer_productId_status_validUntil_idx", "Offer_partnerId_idx", "Offer_merchantId_idx"}.issubset(indexes)
            checks = await connection.run_sync(lambda c: {x["name"] for x in inspect(c).get_check_constraints("Offer")})
            assert {"Offer_price_positive", "Offer_valid_window", "Offer_destination_type", "Offer_commercial_relationship", "Offer_availability", "Offer_status", "Offer_currency"}.issubset(checks)
            fks = await connection.run_sync(lambda c: {x["name"] for x in inspect(c).get_foreign_keys("Offer")})
            assert {"Offer_productId_fkey", "Offer_partnerId_fkey", "Offer_merchantId_fkey"}.issubset(fks)
            click_columns = await connection.run_sync(lambda c: {x["name"]: x for x in inspect(c).get_columns("OutboundClick")})
            assert {"id", "attributionId", "offerId", "createdAt"}.issubset(click_columns)
            click_indexes = await connection.run_sync(lambda c: {x["name"] for x in inspect(c).get_indexes("OutboundClick")})
            assert {"OutboundClick_attributionId_key", "OutboundClick_offerId_createdAt_idx", "OutboundClick_createdAt_idx"}.issubset(click_indexes)
            click_fks = await connection.run_sync(lambda c: {x["name"] for x in inspect(c).get_foreign_keys("OutboundClick")})
            assert {"OutboundClick_offerId_fkey"}.issubset(click_fks)
        async with sessions() as session:
            inserted_by_prisma = await session.get(Product, "foundation-valid")
            assert inserted_by_prisma and inserted_by_prisma.stockQuantity == 7
            blocked_partner = await session.get(Partner, "foundation-blocked-partner")
            offer_input = OfferInput(destination_url="https://evil.test/item", destination_type="marketplace", commercial_relationship="editorial", price=Decimal("10"), availability="in_stock", verification_source="fixture", verified_at=datetime.now(timezone.utc), valid_until=datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year + 1), status="active")
            with pytest.raises(ValueError, match="não aprovado"):
                offer_input.validate_destination(allowed_domains=blocked_partner.allowedDomains, production=True)
            row = await session.get(Product, "foundation-sqlalchemy-write")
            if row: await session.delete(row); await session.commit()
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            session.add(Product(id="foundation-sqlalchemy-write", name="SQLAlchemy write", sku="FOUNDATION-SQLA", price=Decimal("42"), stockQuantity=4, brand="Test", ai_metadata={}, createdAt=now, updatedAt=now))
            await session.commit()
        await engine.dispose()
    run(scenario())


def test_postgres_quota_is_atomic_across_instances():
    async def scenario():
        engine, sessions = resources(); one = PostgresSdrUsageStore(sessions); two = PostgresSdrUsageStore(sessions)
        settings = cfg(SDR_RATE_LIMIT_PER_MINUTE=5, SDR_DAILY_QUOTA=20)
        usage = UsageReservation("concurrent-session", "concurrent-ip", 100, Decimal("0.001"))
        await one.reset("concurrent-session"); await one.reset("concurrent-ip")
        async def attempt(store):
            try: await store.reserve(usage, settings); return True
            except SdrUsageLimitError: return False
        results = await asyncio.gather(*[attempt(one if i % 2 else two) for i in range(12)])
        assert sum(results) == 5
        rows = await one.get_usage("concurrent-session")
        assert max(row["requests"] for row in rows) == 5
        await engine.dispose()
    run(scenario())


def test_sync_dry_run_persist_idempotence_and_guards(monkeypatch):
    async def scenario():
        engine, sessions = resources()
        settings = cfg(SUPPLIER_SYNC_MAX_CHANGES=5, SUPPLIER_SYNC_MAX_PRICE_CHANGE_PCT=40, SUPPLIER_SYNC_MAX_STOCK_DELTA=50)
        monkeypatch.setattr(sync, "get_settings", lambda: settings)
        valid = SupplierProductSnapshot("FOUNDATION-VALID", None, 8, Decimal("95"), "BRL", {})
        monkeypatch.setattr(sync, "get_connector", lambda _: Connector([valid]))
        preview = await sync.sync_products_preview("fixture", [valid.sku]); assert preview["mode"] == "dry-run"
        async with sessions() as session:
            before = await session.get(Product, "foundation-valid"); assert before.stockQuantity == 7
        async with sessions() as session:
            result = await sync.sync_products_persist(session, "fixture", [valid.sku]); assert result["persisted"] == 1 and result["evaluated"] == 1
        async with sessions() as session:
            changed = await session.get(Product, "foundation-valid"); assert changed.stockQuantity == 8 and changed.price == Decimal("95")
            repeat = await sync.sync_products_persist(session, "fixture", [valid.sku]); assert repeat["persisted"] == 0

        partial = SupplierProductSnapshot("FOUNDATION-VALID", None, None, None, "BRL", {}, complete=False, error="timeout")
        monkeypatch.setattr(sync, "get_connector", lambda _: Connector([partial]))
        async with sessions() as session:
            result = await sync.sync_products_persist(session, "fixture", [partial.sku]); assert result["ignored"] == 1

        invalid = SupplierProductSnapshot("FOUNDATION-VALID", None, -1, Decimal("0"), "BRL", {})
        monkeypatch.setattr(sync, "get_connector", lambda _: Connector([invalid]))
        async with sessions() as session:
            result = await sync.sync_products_persist(session, "fixture", [invalid.sku]); assert result["blocked"] == 1

        anomaly = SupplierProductSnapshot("FOUNDATION-VALID", None, 500, Decimal("500"), "BRL", {})
        monkeypatch.setattr(sync, "get_connector", lambda _: Connector([anomaly]))
        async with sessions() as session:
            result = await sync.sync_products_persist(session, "fixture", [anomaly.sku]); assert result["blocked"] == 1
        async with sessions() as session:
            final = await session.get(Product, "foundation-valid"); assert final.stockQuantity == 8 and final.price == Decimal("95")
        await engine.dispose()
    run(scenario())


def test_sync_change_limit_rolls_back_real_transaction(monkeypatch):
    async def scenario():
        engine, sessions = resources(); settings = cfg(SUPPLIER_SYNC_MAX_CHANGES=1)
        monkeypatch.setattr(sync, "get_settings", lambda: settings)
        items = [SupplierProductSnapshot("FOUNDATION-VALID", None, 9, Decimal("96"), "BRL", {}), SupplierProductSnapshot("FOUNDATION-EXPIRED", None, 8, Decimal("100"), "BRL", {})]
        monkeypatch.setattr(sync, "get_connector", lambda _: Connector(items))
        async with sessions() as session:
            with pytest.raises(RuntimeError, match="supplier_change_limit_exceeded"): await sync.sync_products_persist(session, "fixture", [x.sku for x in items])
        async with sessions() as session:
            first = await session.get(Product, "foundation-valid"); second = await session.get(Product, "foundation-expired")
            assert first.stockQuantity == 8 and second.stockQuantity == 7
        await engine.dispose()
    run(scenario())
