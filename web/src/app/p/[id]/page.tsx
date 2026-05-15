import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBridgeView } from "@/components/bridge/ProductBridgeView";
import { prisma } from "@/lib/db";
import { type ProductBridgeDTO, resolveAffiliateCheckoutUrl } from "@/lib/product-bridge";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 120;
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true, brand: true, sku: true, imageUrl: true },
  });
  if (!p) {
    return { title: "Produto | Rocha Smart" };
  }
  const desc =
    p.description?.slice(0, 155) ??
    `${p.name} — análise técnica e curadoria casa inteligente na Rocha Smart antes da oferta oficial.`;
  const keywords = [
    "casa inteligente",
    "tecnologia residencial",
    "produtos conectados",
    "smart home",
    p.brand ?? "Rocha Smart",
    ...(p.sku ? [p.sku] : []),
  ];
  const site = getSiteUrl();
  const canonicalPath = `/p/${id}`;
  const ogImage =
    p.imageUrl?.startsWith("http") ? p.imageUrl : p.imageUrl?.startsWith("/") ? `${site}${p.imageUrl}` : undefined;
  return {
    title: p.name,
    description: desc,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${p.name} | Rocha Smart`,
      description: desc,
      type: "article",
      url: `${site}${canonicalPath}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.name} | Rocha Smart`,
      description: desc,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BridgeProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    notFound();
  }

  const dto: ProductBridgeDTO = {
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    price: product.price.toString(),
    imageUrl: product.imageUrl,
    brand: product.brand,
    ai_metadata: product.ai_metadata,
  };

  const affiliateUrl = resolveAffiliateCheckoutUrl(product.ai_metadata, product.sku);

  return (
    <div className="pb-28">
      <ProductBridgeView dto={dto} affiliateUrl={affiliateUrl} />
    </div>
  );
}
