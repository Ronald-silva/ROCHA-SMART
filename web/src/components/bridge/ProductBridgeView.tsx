import Link from "next/link";
import type { ProductBridgeDTO } from "@/lib/product-bridge";
import { AffiliateCTA } from "@/components/bridge/AffiliateCTA";
import { ProductFeaturesSection } from "@/components/bridge/ProductFeaturesSection";
import { ProductImageGallery } from "@/components/bridge/ProductImageGallery";
import { ProductSpecsSection } from "@/components/bridge/ProductSpecsSection";
import { ProtocolosNaLupaSection } from "@/components/bridge/ProtocolosNaLupaSection";
import { SaraWidget } from "@/components/bridge/SaraWidget";
import { destinationLabel, type PublicOffer } from "@/lib/public-offer";

type Props = {
  dto: ProductBridgeDTO;
  offer: PublicOffer | null;
};

function formatBRL(value: string) {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return `R$ ${value}`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function getGallery(meta: unknown, fallback: string | null): string[] {
  const m = (meta ?? {}) as Record<string, unknown>;
  const g = Array.isArray(m.gallery) ? (m.gallery as string[]) : [];
  if (g.length > 0) return g;
  return fallback ? [fallback] : [];
}

function getEditorial(meta: unknown): { headline?: string; intro?: string } {
  const m = (meta ?? {}) as Record<string, unknown>;
  const ed = m.editorial as Record<string, unknown> | undefined;
  if (!ed) return {};
  return {
    headline: typeof ed.headline === "string" ? ed.headline : undefined,
    intro: typeof ed.intro === "string" ? ed.intro : undefined,
  };
}

export function ProductBridgeView({ dto, offer }: Props) {
  const value = Number.parseFloat(offer?.price ?? dto.price) || 0;
  const checkout = {
    value,
    currency: "BRL" as const,
    items: [{ item_id: dto.sku ?? dto.id, item_name: dto.name, price: value || undefined, quantity: 1 }],
  };

  const gallery = getGallery(dto.ai_metadata, dto.imageUrl);
  const editorial = getEditorial(dto.ai_metadata);
  const formattedPrice = offer ? formatBRL(offer.price) : null;

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">

      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition hover:text-emerald-400">Início</Link>
          </li>
          <li aria-hidden className="text-zinc-600">/</li>
          <li className="text-zinc-400">Catálogo</li>
          <li aria-hidden className="text-zinc-600">/</li>
          <li className="truncate text-zinc-300">{dto.name}</li>
        </ol>
      </nav>

      {/* Cabeçalho editorial */}
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
          Matéria · curadoria de produto
        </p>
        <h1
          className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.6rem]"
          style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
        >
          {editorial.headline ?? dto.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-4 text-sm">
          {dto.brand && (
            <span className="text-zinc-500">
              Marca <span className="ml-1 font-semibold text-zinc-200">{dto.brand}</span>
            </span>
          )}
          {dto.sku && (
            <span className="text-zinc-500">
              SKU{" "}
              <code className="ml-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
                {dto.sku}
              </code>
            </span>
          )}
          <span className="ml-auto text-2xl font-bold tabular-nums text-emerald-400">
            {formattedPrice ?? "Oferta em atualização"}
          </span>
        </div>
      </header>

      {/* Galeria de imagens */}
      <ProductImageGallery images={gallery} alt={dto.name} />

      {/* Intro editorial + disclosure */}
      <section className="space-y-3">
        <p
          className="text-pretty text-lg leading-relaxed text-zinc-300 sm:text-xl"
          style={{ fontFamily: "var(--font-rs-body, system-ui), sans-serif" }}
        >
          {editorial.intro ?? dto.description}
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
          Esta é uma página de análise e curadoria. A compra — pagamento, nota fiscal, garantia e
          suporte — é sempre concluída no{" "}
          <strong className="text-zinc-400">ambiente do parceiro informado na oferta</strong>.
        </p>
      </section>

      {/* Diferenciais */}
      <ProductFeaturesSection ai_metadata={dto.ai_metadata} />

      {/* Ficha técnica */}
      <ProductSpecsSection ai_metadata={dto.ai_metadata} />

      {/* Matter vs Zigbee — white paper */}
      <ProtocolosNaLupaSection ai_metadata={dto.ai_metadata} />

      {/* CTA principal */}
      <section className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
              >
                {offer ? `Oferta em ${offer.merchantName}` : "Oferta sendo atualizada"}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Clique abaixo para ver a oferta completa — parcelamento, cupons e garantia no checkout
                do vendedor.
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums text-emerald-400 sm:shrink-0">
              {formattedPrice ?? "—"}
            </span>
          </div>

          {offer ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-400">Loja: <strong className="text-zinc-200">{offer.merchantName}</strong>{offer.seller ? <> · Vendedor: <strong className="text-zinc-200">{offer.seller}</strong></> : null}</p>
              <AffiliateCTA
                offerId={offer.id}
                checkout={checkout}
                label={destinationLabel(offer.destinationType, offer.merchantName)}
              />
              <p className="text-[11px] leading-relaxed text-zinc-500">
                {offer.commercialRelationship === "affiliate" ? "Link de parceiro: a Rocha Smart pode receber comissão, sem custo adicional para você. " : ""}
                Verificado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(offer.verifiedAt))}. Preço, estoque e condições podem mudar no parceiro.
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-amber-200/80">
              Este produto não possui oferta válida no momento. Estamos verificando preço e disponibilidade.
            </p>
          )}
        </div>
      </section>

      <SaraWidget productName={dto.name} productId={dto.id} />
    </article>
  );
}
