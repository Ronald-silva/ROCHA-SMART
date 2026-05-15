import Link from "next/link";

export function SiteFooter() {
  const y = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-[#020204]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="grid gap-10 border-b border-white/5 pb-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
              Rocha Smart
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              <strong className="font-medium text-zinc-400">Magazine digital</strong> de tecnologia e casa inteligente —
              pauta de produtos, olhar de editor e leitura antes do clique. Aqui é conteúdo:{" "}
              <strong className="font-medium text-zinc-400">compra e pós-venda</strong> ficam no{" "}
              <strong className="font-medium text-zinc-400">canal oficial</strong> (sem projeto nem instalação por
              aqui).
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Institucional</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/#faq" className="transition hover:text-emerald-400">
                  Tira-dúvidas
                </Link>
              </li>
              <li>
                <Link href="/#curadoria" className="transition hover:text-emerald-400">
                  Na vitrine
                </Link>
              </li>
              <li>
                <span className="text-zinc-600">Política de privacidade (em breve)</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Parcerias</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              Alguns links são de parceiro: se você comprar no oficial, a Rocha Smart pode ganhar comissão —{" "}
              <strong className="text-zinc-400">zero custo extra</strong> para você. Preço e condições fecham no{" "}
              <strong className="text-zinc-400">checkout deles</strong>.
            </p>
          </div>
        </div>
        <p className="pt-8 text-center text-xs text-zinc-600">
          © {y} Rocha Smart · Brasil
        </p>
      </div>
    </footer>
  );
}
