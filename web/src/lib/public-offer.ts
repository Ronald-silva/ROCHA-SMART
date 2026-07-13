import type { Offer, Merchant, Partner } from "@prisma/client";

type OfferWithRelations = Offer & { partner: Partner; merchant: Merchant };

export type PublicOffer = {
  id: string;
  destinationType: string;
  commercialRelationship: string;
  price: string;
  currency: string;
  availability: string;
  merchantName: string;
  seller: string | null;
  verifiedAt: string;
};

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

export function isAllowedHost(host: string, allowedDomains: string[]) {
  const normalized = normalizeHost(host);
  return allowedDomains.some((entry) => {
    const allowed = normalizeHost(entry);
    return normalized === allowed || normalized.endsWith(`.${allowed}`);
  });
}

export function toPublicOffer(offer: OfferWithRelations, now = new Date()): PublicOffer | null {
  if (offer.status !== "active" || offer.partner.status !== "active" || offer.merchant.status !== "active") return null;
  if (!['in_stock', 'preorder'].includes(offer.availability)) return null;
  if (offer.verifiedAt > now || offer.validUntil <= now) return null;

  let url: URL;
  try {
    url = new URL(offer.destinationUrl);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  if (!isAllowedHost(url.hostname, offer.partner.allowedDomains)) return null;
  if (!isAllowedHost(url.hostname, [offer.merchant.domain])) return null;

  return {
    id: offer.id,
    destinationType: offer.destinationType,
    commercialRelationship: offer.commercialRelationship,
    price: offer.price.toString(),
    currency: offer.currency,
    availability: offer.availability,
    merchantName: offer.merchant.name,
    seller: offer.seller,
    verifiedAt: offer.verifiedAt.toISOString(),
  };
}

export function destinationLabel(type: string, merchant: string) {
  if (type === "manufacturer") return `Ver no fabricante (${merchant})`;
  if (type === "official_store") return `Ver na loja oficial ${merchant}`;
  if (type === "marketplace") return `Ver oferta em ${merchant}`;
  return `Ver oferta na loja ${merchant}`;
}
