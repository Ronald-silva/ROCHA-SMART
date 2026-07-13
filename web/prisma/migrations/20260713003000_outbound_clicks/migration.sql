-- Eventos first-party de saída para parceiros. Não armazena IP, user-agent ou click IDs brutos.
CREATE TABLE "OutboundClick" (
    "id" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "referrerHost" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutboundClick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutboundClick_attributionId_key" ON "OutboundClick"("attributionId");
CREATE INDEX "OutboundClick_offerId_createdAt_idx" ON "OutboundClick"("offerId", "createdAt");
CREATE INDEX "OutboundClick_createdAt_idx" ON "OutboundClick"("createdAt");

ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_offerId_fkey"
FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
