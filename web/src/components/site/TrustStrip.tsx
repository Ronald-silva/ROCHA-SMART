/** Faixa editorial — promessas de leitura (sem marcas de terceiros). */
export function TrustStrip() {
  const items = [
    "Protocolos na lupa",
    "Wi‑Fi, Zigbee, Matter — sem mistério",
    "Menos surpresa depois do unboxing",
    "Sara no chat, link no lugar certo",
  ];
  return (
    <section className="border-y border-white/10 bg-white/[0.02]" aria-label="Compromissos de curadoria">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 sm:gap-x-10 sm:px-8">
        {items.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 sm:text-sm"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/80" aria-hidden />
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
