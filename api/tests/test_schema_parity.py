import re
import unittest
from pathlib import Path

from app.models import Base


class SchemaParityTests(unittest.TestCase):
    def test_sqlalchemy_maps_every_prisma_table_used_by_api(self) -> None:
        expected = {"Product", "Order", "OrderItem", "Partner", "Merchant", "Offer", "PriceSnapshot", "SdrUsageBucket"}
        self.assertTrue(expected.issubset(set(Base.metadata.tables)))

    def test_offer_migration_and_prisma_models_stay_aligned(self) -> None:
        repo = Path(__file__).resolve().parents[2]
        schema = (repo / "web/prisma/schema.prisma").read_text(encoding="utf-8")
        migration = (repo / "web/prisma/migrations/20260713001000_offer_foundation/migration.sql").read_text(
            encoding="utf-8"
        )
        models = set(re.findall(r"^model\s+(\w+)\s+\{", schema, flags=re.MULTILINE))
        tables = set(re.findall(r'CREATE TABLE "([^"]+)"', migration))
        self.assertEqual({"Partner", "Merchant", "Offer", "PriceSnapshot"}, tables)
        self.assertTrue(tables.issubset(models))
