import type { Prisma } from "@prisma/client";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function ProductSpecsSection({ ai_metadata }: { ai_metadata: Prisma.JsonValue }) {
  const root = (ai_metadata ?? {}) as Record<string, unknown>;
  const sh = root.smart_home;
  const block = isRecord(sh) ? sh : {};

  const entries: { label: string; value: string }[] = [];

  if (typeof block.voltage === "string" && block.voltage) {
    entries.push({ label: "Voltagem", value: block.voltage });
  }
  if (Array.isArray(block.connectivity) && block.connectivity.length) {
    entries.push({
      label: "Conectividade",
      value: block.connectivity.map(String).join(", "),
    });
  }
  if (Array.isArray(block.protocols) && block.protocols.length) {
    entries.push({
      label: "Protocolos",
      value: block.protocols.map(String).join(", "),
    });
  }

  const extras = Object.entries(block).filter(
    ([k]) => !["voltage", "connectivity", "protocols", "extra"].includes(k),
  );
  for (const [k, v] of extras) {
    if (v === null || v === undefined || v === "") continue;
    entries.push({ label: k, value: typeof v === "object" ? JSON.stringify(v) : String(v) });
  }

  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
          Especificações técnicas
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Quando os dados estiverem disponíveis, esta área mostra voltagem, conectividade e protocolos — o tipo de
          detalhe que evita surpresa na instalação e na integração com o restante da casa.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-rs-display), sans-serif" }}>
        Especificações técnicas
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        O que costuma importar na hora de instalar ou integrar ao restante da casa.
      </p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {entries.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/5 bg-black/20 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{row.label}</dt>
            <dd className="mt-1.5 text-sm font-medium leading-snug text-zinc-100">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
