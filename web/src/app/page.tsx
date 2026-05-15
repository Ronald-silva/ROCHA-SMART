import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { HomeFaq } from "@/components/site/HomeFaq";
import { HomeHowItWorks } from "@/components/site/HomeHowItWorks";
import { TrustStrip } from "@/components/site/TrustStrip";

export const dynamic = "force-dynamic";

type ProductCard = {
  id: string;
  name: string;
  price: string;
  description: string | null;
  imageUrl: string | null;
};

function formatBRL(value: string) {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return `R$ ${value}`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default async function Home() {
  let products: ProductCard[] = [];
  try {
    const rows = await prisma.product.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, price: true, description: true, imageUrl: true },
    });
    products = rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price.toString(),
      description: r.description,
      imageUrl: r.imageUrl,
    }));
  } catch {
    products = [];
  }

  return (
    <>
      {/* Hero — padrão “above the fold” de marcas tech + produto */}
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="rs-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          className="absolute -left-1/4 top-0 h-[520px] w-[70%] rounded-full bg-emerald-600/20 blur-[120px]"
          aria-hidden
        />
        <div
          className="absolute -right-1/4 bottom-0 h-[400px] w-[60%] rounded-full bg-amber-500/12 blur-[100px]"
          aria-hidden
        />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:gap-14 lg:pb-24 lg:pt-20">
          <p className="rs-reveal rs-reveal-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/90">
            Magazine · tech & casa inteligente
          </p>
          <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div>
              <h1
                className="rs-reveal rs-reveal-2 max-w-[18ch] text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
              >
                Tech que mora na sua casa — sem comprar no escuro.
              </h1>
              <p className="rs-reveal rs-reveal-3 mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl">
                A gente pauta <strong className="font-semibold text-zinc-200">gadgets e smart home</strong> com estética
                de capa, texto que explica o “por quê” e ficha que tira a dúvida chata antes do clique. Fechamento? Sempre
                no <strong className="font-semibold text-zinc-200">site oficial</strong> — onde entra cupom, parcelamento
                e garantia de verdade.
              </p>
            </div>
            <aside className="rs-reveal rs-reveal-4 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-md sm:p-6">
              <p className="text-sm font-medium text-zinc-300">O que esta edição entrega</p>
              <ul className="space-y-3 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    1
                  </span>
                  <span>
                    <strong className="text-zinc-200">Capa que vende a história</strong> — foto, benefício e tom de
                    revista; você entende o apelo em segundos.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    2
                  </span>
                  <span>
                    <strong className="text-zinc-200">Coluna técnica séria</strong> — protocolos, voltagem, rede; o que
                    costuma virar devolução se sumir do anúncio.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    3
                  </span>
                  <span>
                    <strong className="text-zinc-200">Sara no plantão</strong> — tira dúvida no ritmo de chat e te joga
                    pro link certo do fabricante ou loja oficial.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </header>

      <TrustStrip />

      <HomeHowItWorks />

      <main id="curadoria" className="scroll-mt-24 border-t border-white/10">
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-16">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
              >
                Na vitrine
              </h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-500 sm:text-base">
                Capas da edição: abre a matéria completa e, quando bater o tchan, segue pro checkout do parceiro oficial.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/15 bg-gradient-to-br from-white/[0.05] to-transparent p-10 sm:p-14">
              <div
                className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-500/10 blur-3xl"
                aria-hidden
              />
              <div className="relative mx-auto max-w-lg text-center" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-400/90">Vitrine</p>
                <p className="mt-4 text-2xl font-bold text-white sm:text-3xl">Primeira edição no ar.</p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400" style={{ fontFamily: "var(--font-rs-body), sans-serif" }}>
                  Cadastre os produtos — cada um vira uma página com cara de matéria, SEO e CTA para o canal oficial.
                </p>
              </div>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/p/${p.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-emerald-500/35 hover:bg-white/[0.06] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
                  >
                    <div className="relative aspect-[4/3] bg-zinc-900">
                      {p.imageUrl ? (
                        p.imageUrl.startsWith("/") ? (
                          <Image
                            src={p.imageUrl}
                            alt=""
                            fill
                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width:768px) 100vw, 33vw"
                            priority={i === 0}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            loading={i === 0 ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={i === 0 ? "high" : "low"}
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-xs text-zinc-500">
                          Adicionar foto do produto
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">Matéria</p>
                        <p
                          className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-white"
                          style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
                        >
                          {p.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      {p.description ? (
                        <p className="line-clamp-2 text-sm text-zinc-500">{p.description}</p>
                      ) : (
                        <p className="text-sm text-zinc-600">Ver especificações na página.</p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-lg font-semibold text-emerald-400">{formatBRL(p.price)}</span>
                        <span className="text-sm font-medium text-zinc-400 transition group-hover:text-emerald-300">
                          Ler ficha →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <HomeFaq />
    </>
  );
}
