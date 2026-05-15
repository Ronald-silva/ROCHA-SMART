const faqs = [
  {
    q: "A Rocha Smart vende o produto direto?",
    a: "Não vendemos aqui. Montamos a ficha, o contexto e o atendimento para você decidir com calma; pagamento, nota fiscal, garantia e troca seguem as regras do site oficial do fabricante ou da loja autorizada.",
  },
  {
    q: "Por que não há carrinho neste site?",
    a: "Queremos que você veja o produto com clareza técnica e, quando fizer sentido, continue no canal onde a compra é realmente processada — com o mesmo carrinho e checkout que o vendedor oficial oferece.",
  },
  {
    q: "Como sei se o dispositivo funciona na minha casa?",
    a: "Confira voltagem, protocolos e conectividade na ficha e pergunte à Sara para cenários típicos (rede, hub, assistente de voz). Se ainda sobrar dúvida crítica, o suporte do fabricante no site oficial é a referência final.",
  },
  {
    q: "Os preços exibidos são finais?",
    a: "Os valores ajudam a comparar rapidamente. Cupom, parcelamento e preço fechado são sempre confirmados no checkout do vendedor oficial no momento da compra.",
  },
];

export function HomeFaq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/10 bg-[#06060a]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-20">
        <h2
          className="text-2xl font-bold text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
        >
          Tira-dúvidas
        </h2>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">
          Respostas secas — estilo caixinha de revista, sem juridiquês vazio.
        </p>
        <div className="mt-8 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-1 transition open:border-emerald-500/25 open:bg-emerald-500/[0.04]"
            >
              <summary className="cursor-pointer list-none py-4 text-sm font-semibold text-zinc-100 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-lg font-normal text-emerald-500/80 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="border-t border-white/5 pb-4 pt-2 text-sm leading-relaxed text-zinc-400">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
