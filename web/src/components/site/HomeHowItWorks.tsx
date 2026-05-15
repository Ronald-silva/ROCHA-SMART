const steps = [
  {
    title: "1. Abre a matéria",
    body: "Ficha com o que a caixa promete: protocolos, voltagem, rede — o que uma boa review deixa explícito antes do “comprei errado”.",
  },
  {
    title: "2. Rola o chat com a Sara",
    body: "Dúvida de cenário real? Ela conversa no ritmo de feed e te empurra pro link oficial quando faz sentido.",
  },
  {
    title: "3. Fecha na loja deles",
    body: "Cupom, parcelamento, NF e garantia no checkout do fabricante ou loja autorizada — o fechamento que importa.",
  },
];

export function HomeHowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
          >
            Da capa ao checkout oficial
          </h2>
          <p className="mt-3 text-sm text-zinc-500 sm:text-base">
            Três passos no ritmo de revista digital — rápido, direto, sem enrolar quem veio de anúncio.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6"
            >
              <p className="text-sm font-bold text-emerald-400/90" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
                {s.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
