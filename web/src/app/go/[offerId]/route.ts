import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPublicOffer } from "@/lib/public-offer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UTM_FIELDS = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
} as const;

type UTMField = (typeof UTM_FIELDS)[keyof typeof UTM_FIELDS];
type RouteParams = { params: Promise<{ offerId: string }> };

function safeTrackingValue(value: string | null): string | null {
  return value && value.length <= 512 && /^[A-Za-z0-9._~-]+$/.test(value) ? value : null;
}

function getReferrerHost(request: Request): string | null {
  const referrer = request.headers.get("referer");
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.slice(0, 255) || null;
  } catch {
    return null;
  }
}

function configuredSubIdParam(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const tracking = (metadata as Record<string, unknown>).tracking;
  if (!tracking || typeof tracking !== "object" || Array.isArray(tracking)) return null;
  const value = (tracking as Record<string, unknown>).subidParam;
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value) ? value : null;
}

/**
 * Registra uma saída first-party e só então redireciona para uma oferta ainda pública.
 * Click IDs recebidos são encaminhados ao parceiro, mas não persistidos no banco.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { offerId } = await params;
  let offer;
  try {
    offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { partner: true, merchant: true },
    });
  } catch (error) {
    console.error("outbound_click_offer_lookup_failed", { offerId, error });
    return new NextResponse("Serviço temporariamente indisponível.", { status: 503 });
  }

  const publicOffer = offer ? toPublicOffer(offer) : null;
  if (!offer || !publicOffer) return new NextResponse("Oferta indisponível.", { status: 404 });

  const attributionId = randomUUID();
  const utm: Partial<Record<UTMField, string>> = {};
  for (const [queryName, fieldName] of Object.entries(UTM_FIELDS) as [keyof typeof UTM_FIELDS, UTMField][]) {
    const value = safeTrackingValue(new URL(request.url).searchParams.get(queryName));
    if (value) utm[fieldName] = value;
  }

  try {
    await prisma.outboundClick.create({
      data: { attributionId, offerId: offer.id, ...utm, referrerHost: getReferrerHost(request) },
    });
  } catch (error) {
    console.error("outbound_click_record_failed", { offerId: offer.id, error });
    return new NextResponse("Serviço temporariamente indisponível.", { status: 503 });
  }

  const destination = new URL(offer.destinationUrl);
  for (const name of ["fbclid", "gclid"] as const) {
    const value = safeTrackingValue(new URL(request.url).searchParams.get(name));
    if (value && !destination.searchParams.has(name)) destination.searchParams.set(name, value);
  }
  const subIdParam = configuredSubIdParam(offer.affiliateMetadata);
  if (subIdParam && !destination.searchParams.has(subIdParam)) destination.searchParams.set(subIdParam, attributionId);

  return NextResponse.redirect(destination, { status: 302 });
}
