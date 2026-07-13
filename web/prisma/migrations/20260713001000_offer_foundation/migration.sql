-- Migration aditiva e compatível: não remove nem altera campos legados de Product.

CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "allowedDomains" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Partner_status" CHECK ("status" IN ('active', 'inactive'))
);

CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Merchant_status" CHECK ("status" IN ('active', 'inactive'))
);

CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "seller" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL,
    "commercialRelationship" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "availability" TEXT NOT NULL,
    "verificationSource" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "affiliateMetadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Offer_price_positive" CHECK ("price" >= 0),
    CONSTRAINT "Offer_valid_window" CHECK ("validUntil" > "verifiedAt"),
    CONSTRAINT "Offer_destination_type" CHECK ("destinationType" IN ('manufacturer', 'official_store', 'marketplace', 'third_party_seller')),
    CONSTRAINT "Offer_commercial_relationship" CHECK ("commercialRelationship" IN ('affiliate', 'sponsored', 'editorial')),
    CONSTRAINT "Offer_availability" CHECK ("availability" IN ('in_stock', 'preorder', 'out_of_stock', 'unknown')),
    CONSTRAINT "Offer_status" CHECK ("status" IN ('draft', 'active', 'paused', 'expired')),
    CONSTRAINT "Offer_currency" CHECK (char_length("currency") = 3)
);

CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PriceSnapshot_price_positive" CHECK ("price" >= 0),
    CONSTRAINT "PriceSnapshot_availability" CHECK ("availability" IN ('in_stock', 'preorder', 'out_of_stock', 'unknown')),
    CONSTRAINT "PriceSnapshot_currency" CHECK (char_length("currency") = 3)
);

CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");
CREATE UNIQUE INDEX "Merchant_partnerId_slug_key" ON "Merchant"("partnerId", "slug");
CREATE INDEX "Merchant_domain_idx" ON "Merchant"("domain");
CREATE INDEX "Offer_productId_status_validUntil_idx" ON "Offer"("productId", "status", "validUntil");
CREATE INDEX "Offer_partnerId_idx" ON "Offer"("partnerId");
CREATE INDEX "Offer_merchantId_idx" ON "Offer"("merchantId");
CREATE INDEX "PriceSnapshot_offerId_capturedAt_idx" ON "PriceSnapshot"("offerId", "capturedAt");

ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
