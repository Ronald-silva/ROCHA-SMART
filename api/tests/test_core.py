import unittest
from decimal import Decimal

from pydantic import ValidationError

from app.config import Settings
from app.schemas.product import (
    ProductCreate,
    merge_affiliate_url_into_metadata,
    merge_smart_specs_into_metadata,
)
from app.schemas.offer import OfferInput
from datetime import datetime, timedelta, timezone
from app.security import create_access_token, decode_token, verify_client_credentials


class ProductContractTests(unittest.TestCase):
    def test_product_create_accepts_commercial_url(self) -> None:
        product = ProductCreate(
            name="Sensor Matter",
            price=Decimal("129.90"),
            affiliate_url="https://parceiro.example/produto",
        )
        metadata = merge_smart_specs_into_metadata({}, product.smart_specs)
        metadata = merge_affiliate_url_into_metadata(metadata, product.affiliate_url)

        self.assertEqual(
            metadata["affiliate"]["checkout_url"],
            "https://parceiro.example/produto",
        )

    def test_product_rejects_non_http_commercial_url(self) -> None:
        with self.assertRaises(ValidationError):
            ProductCreate(
                name="Sensor Matter",
                price=Decimal("129.90"),
                affiliate_url="javascript:alert(1)",
            )

    def test_affiliate_url_can_be_removed_without_losing_other_metadata(self) -> None:
        metadata = {
            "affiliate": {"checkout_url": "https://example.com", "network": "amazon"},
            "editorial": {"headline": "Teste"},
        }
        result = merge_affiliate_url_into_metadata(metadata, None)

        self.assertEqual(result["affiliate"], {"network": "amazon"})
        self.assertEqual(result["editorial"], {"headline": "Teste"})


class ProductionSettingsTests(unittest.TestCase):
    def test_production_rejects_development_defaults(self) -> None:
        with self.assertRaises(ValidationError):
            Settings(DATABASE_URL="postgresql://localhost/test", APP_ENV="production")

    def test_production_accepts_explicit_secure_settings(self) -> None:
        settings = Settings(
            DATABASE_URL="postgresql://localhost/test",
            APP_ENV="production",
            JWT_SECRET_KEY="x" * 40,
            AUTH_CLIENTS_JSON='{"frontend":"a-secure-client-secret"}',
            CORS_ORIGINS="https://rochasmart.com.br",
            SDR_GATEWAY_SECRET="s" * 40,
            SDR_IDENTITY_HASH_SALT="h" * 40,
            SDR_USAGE_STORE="postgres",
            SDR_STORE_FAILURE_POLICY="closed",
        )

        self.assertEqual(settings.cors_origins_list(), ["https://rochasmart.com.br"])


class OfferContractTests(unittest.TestCase):
    def offer(self, url="https://loja.example/produto"):
        now = datetime.now(timezone.utc)
        return OfferInput(destination_url=url, destination_type="official_store", commercial_relationship="editorial", price=Decimal("10"), availability="in_stock", verification_source="manual", verified_at=now, valid_until=now + timedelta(hours=1))

    def test_allowlist_accepts_subdomain(self):
        self.offer("https://ofertas.loja.example/x").validate_destination(allowed_domains=["loja.example"], production=True)

    def test_allowlist_rejects_lookalike(self):
        with self.assertRaises(ValueError):
            self.offer("https://loja.example.evil.test/x").validate_destination(allowed_domains=["loja.example"], production=True)

    def test_production_requires_https(self):
        with self.assertRaises(ValueError):
            self.offer("http://loja.example/x").validate_destination(allowed_domains=["loja.example"], production=True)

    def test_expired_offer_is_not_actionable(self):
        offer = self.offer()
        self.assertFalse(offer.model_copy(update={"status": "active", "valid_until": datetime.now(timezone.utc) - timedelta(seconds=1)}).is_publicly_actionable())


class AuthTests(unittest.TestCase):
    def test_token_roundtrip_and_invalid_signature(self):
        cfg = Settings(DATABASE_URL="postgresql://localhost/test", JWT_SECRET_KEY="secret-a", AUTH_CLIENTS_JSON='{"frontend":"client-secret"}')
        token = create_access_token(subject="frontend", settings=cfg)
        self.assertEqual(decode_token(token, settings=cfg), "frontend")
        other = Settings(DATABASE_URL="postgresql://localhost/test", JWT_SECRET_KEY="secret-b")
        with self.assertRaises(ValueError): decode_token(token, settings=other)
        self.assertTrue(verify_client_credentials("frontend", "client-secret", cfg))
        self.assertFalse(verify_client_credentials("frontend", "wrong", cfg))


if __name__ == "__main__":
    unittest.main()
