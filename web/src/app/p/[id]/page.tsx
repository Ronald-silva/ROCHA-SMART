import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBridgeView } from "@/components/bridge/ProductBridgeView";
import { prisma } from "@/lib/db";
import { type ProductBridgeDTO } from "@/lib/product-bridge";
import { toPublicOffer } from "@/lib/public-offer";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 120;
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let p;
  try {
    p = await prisma.product.findUnique({
      where: { id },
      select: { name: true, description: true, brand: true, sku: true, imageUrl: true },
    });
  } catch (error) {
    console.error("product_metadata_catalog_unavailable", { productId: id, error });
    return { title: "Produto temporariamente indisponível | Rocha Smart", robots: { index: false, follow: false } };
  }
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
  let product;
  try {
    product = await prisma.product.findUnique({
      where: { id },
      include: { offers: { include: { partner: true, merchant: true }, orderBy: { verifiedAt: "desc" } } },
    });
  } catch (error) {
    console.error("product_page_catalog_unavailable", { productId: id, error });
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center"><h1 className="text-2xl font-bold text-white">Catálogo temporariamente indisponível</h1><p className="mt-3 text-zinc-400">Não foi possível carregar este produto. Tente novamente mais tarde.</p></main>;
  }
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

  const offer = product.offers.map((candidate) => toPublicOffer(candidate)).find(Boolean) ?? null;

  return (
    <div className="pb-28">
      <ProductBridgeView dto={dto} offer={offer} />
    </div>
  );
}
