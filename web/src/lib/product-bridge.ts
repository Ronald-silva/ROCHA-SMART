import type { Prisma } from "@prisma/client";

export type ProductBridgeDTO = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: string;
  imageUrl: string | null;
  brand: string | null;
  ai_metadata: Prisma.JsonValue;
};

export function resolveAffiliateCheckoutUrl(
  aiMetadata: Prisma.JsonValue,
  sku: string | null,
): string | null {
  const m = (aiMetadata ?? {}) as Record<string, unknown>;
  const affiliate = m.affiliate as Record<string, unknown> | undefined;
  const direct =
    (affiliate?.checkout_url as string | undefined) ||
    (m.checkout_url as string | undefined) ||
    (m.link_afiliado as string | undefined) ||
    (m.affiliate_url as string | undefined);
  if (typeof direct === "string" && direct.startsWith("http")) {
    return direct;
  }
  const template = process.env.NEXT_PUBLIC_AFFILIATE_LINK_TEMPLATE;
  if (template && sku) {
    return template.replace(/\{\{\s*sku\s*\}\}/gi, encodeURIComponent(sku));
  }
  const fallback = process.env.NEXT_PUBLIC_DEFAULT_AFFILIATE_URL;
  if (typeof fallback === "string" && fallback.startsWith("http")) {
    return fallback;
  }
  return null;
}
