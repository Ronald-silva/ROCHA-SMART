"use client";

import { useCallback, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export function SaraWidget({ productName, productId }: { productName: string; productId: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        `Olá, sou a Sara, da Rocha Smart. Posso ajudar com dúvidas práticas sobre ${productName} ` +
        "(compatibilidade, rede, instalação). Quando você quiser fechar, use o botão Ir ao site oficial acima — é lá que ficam pagamento e garantia.",
    },
  ]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch("/api/sdr/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Contexto: página do produto id=${productId}, nome=${productName}. Pergunta: ${trimmed}`,
          persona: "sara",
        }),
      });
      const data = (await res.json()) as { resposta?: string; detail?: string };
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.detail ?? "Serviço temporariamente indisponível. Tente novamente." },
        ]);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", text: data.resposta ?? "" }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Erro de rede. Verifique sua conexão." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, productId, productName]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="flex h-[min(420px,70vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c10] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
                Sara
              </p>
              <p className="text-xs text-zinc-500">Curadoria · casa inteligente</p>
            </div>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
              onClick={() => setOpen(false)}
            >
              Fechar
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user"
                    ? "ml-8 rounded-2xl bg-emerald-600 px-3 py-2.5 text-white"
                    : "mr-6 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-zinc-200"
                }
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))}
            {loading ? <p className="text-xs text-zinc-500">Processando…</p> : null}
          </div>
          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="Ex.: precisa de hub?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                onClick={send}
                disabled={loading}
              >
                Enviar
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-600">
              Compra e garantia no site do vendedor oficial.
            </p>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold tracking-wide text-white shadow-lg shadow-emerald-900/40 ring-2 ring-[#050508] transition hover:bg-emerald-500"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir atendimento com a Sara"
      >
        Sara
      </button>
    </div>
  );
}
