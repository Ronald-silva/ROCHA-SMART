import type { Prisma } from "@prisma/client";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const SPEC_ORDER: [key: string, label: string][] = [
  ["display", "Tela"],
  ["audio", "Áudio"],
  ["camera", "Câmera"],
  ["voltage", "Voltagem"],
  ["connectivity", "Conectividade"],
  ["protocols", "Protocolos"],
  ["hub_integrado", "Hub integrado"],
  ["processor", "Processador"],
  ["dimensions", "Dimensões"],
  ["weight", "Peso"],
  ["garantia", "Garantia"],
];

const SKIP_KEYS = new Set(SPEC_ORDER.map(([k]) => k).concat(["extra"]));

type SpecEntry = { label: string; value: string; wide: boolean };

function buildEntries(block: Record<string, unknown>): SpecEntry[] {
  const entries: SpecEntry[] = [];

  for (const [key, label] of SPEC_ORDER) {
    const v = block[key];
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v)) {
      const str = v.map(String).join(" · ");
      entries.push({ label, value: str, wide: v.length > 2 });
    } else {
      const str = String(v);
      entries.push({ label, value: str, wide: str.length > 50 });
    }
  }

  for (const [k, v] of Object.entries(block)) {
    if (SKIP_KEYS.has(k) || v === null || v === undefined || v === "") continue;
    const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const str = typeof v === "object" ? JSON.stringify(v) : String(v);
    entries.push({ label, value: str, wide: str.length > 50 });
  }

  return entries;
}

export function ProductSpecsSection({ ai_metadata }: { ai_metadata: Prisma.JsonValue }) {
  const root = (ai_metadata ?? {}) as Record<string, unknown>;
  const sh = root.smart_home;
  const block = isRecord(sh) ? sh : {};
  const entries = buildEntries(block);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h2
        className="mb-1 text-lg font-bold text-white"
        style={{ fontFamily: "var(--font-rs-display), sans-serif" }}
      >
        Ficha técnica
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        O que importa na hora de instalar e integrar ao restante da casa.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-600">Dados técnicos disponíveis em breve.</p>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          {entries.map((row) => (
            <div
              key={row.label}
              className={`rounded-xl border border-white/5 bg-black/20 p-4 ${
                row.wide ? "sm:col-span-2" : ""
              }`}
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {row.label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium leading-snug text-zinc-100">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
