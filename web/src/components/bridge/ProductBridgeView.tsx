import Link from "next/link";
import type { ProductBridgeDTO } from "@/lib/product-bridge";
import { AffiliateCTA } from "@/components/bridge/AffiliateCTA";
import { ProductSpecsSection } from "@/components/bridge/ProductSpecsSection";
import { SaraWidget } from "@/components/bridge/SaraWidget";

type Props = {
  dto: ProductBridgeDTO;
  affiliateUrl: string | null;
};

export function ProductBridgeView({ dto, affiliateUrl }: Props) {
  const value = Number.parseFloat(dto.price) || 0;
  const checkout = {
    value,
    currency: "BRL" as const,
    items: [
      {
        item_id: dto.sku ?? dto.id,
        item_name: dto.name,
        price: value > 0 ? value : undefined,
        quantity: 1,
      },
    ],
  };

  const hero = dto.imageUrl;

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-12">
      <nav className="text-xs text-zinc-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition hover:text-emerald-400">
              Início
            </Link>
          </li>
          <li aria-hidden className="text-zinc-600">
            /
          </li>
          <li className="text-zinc-400">Catálogo</li>
          <li aria-hidden className="text-zinc-600">
            /
          </li>
          <li className="truncate text-zinc-300">{dto.name}</li>
        </ol>
      </nav>

      <header className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">Matéria · review na prática</p>
        <h1
          className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
        >
          {dto.name}
        </h1>
        {dto.brand ? (
          <p className="text-sm text-zinc-500">
            Marca: <span className="font-medium text-zinc-300">{dto.brand}</span>
            {dto.sku ? (
              <>
                {" "}
                · <span className="text-zinc-500">SKU</span>{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-400">{dto.sku}</code>
              </>
            ) : null}
          </p>
        ) : null}
        <div className="relative aspect-[16/9] w-full max-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
          {hero ? (
            <img
              src={hero}
              alt=""
              width={1600}
              height={900}
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-zinc-500">
              Imagem do produto (recomendado para LCP e conversão)
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
        {dto.description ? (
          <p className="text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl">{dto.description}</p>
        ) : null}
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          Use esta página para <strong className="text-zinc-300">bater o olho no produto</strong>, conferir detalhes que
          importam na instalação e tirar dúvidas com a Sara. A compra em si — pagamento, nota fiscal e pós-venda — fica
          sempre com o <strong className="text-zinc-300">vendedor oficial</strong> (fabricante ou loja autorizada).
        </p>
      </header>

      <ProductSpecsSection ai_metadata={dto.ai_metadata} />

      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
          Fechar no site oficial
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
          Quando você estiver pronto, seguimos para o checkout do vendedor oficial — é lá que entram cupom, parcelamento,
          garantia e suporte.
        </p>
        {affiliateUrl ? (
          <>
            <AffiliateCTA affiliateUrl={affiliateUrl} checkout={checkout} label="Ir ao site oficial" />
            <p className="text-center text-[11px] leading-relaxed text-zinc-500 sm:text-left">
              A Rocha Smart pode receber comissão por compras feitas por este link, sem custo extra para você. Preço e
              condições finais são sempre os do site do vendedor.
            </p>
          </>
        ) : (
          <p className="text-sm font-medium text-amber-200/90">
            Defina <code className="rounded bg-black/30 px-1">ai_metadata.affiliate.checkout_url</code> ou{" "}
            <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_DEFAULT_AFFILIATE_URL</code>.
          </p>
        )}
      </section>

      <SaraWidget productName={dto.name} productId={dto.id} />
    </article>
  );
}
