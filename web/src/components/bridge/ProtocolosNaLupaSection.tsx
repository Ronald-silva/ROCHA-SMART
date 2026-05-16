import type { Prisma } from "@prisma/client";
import { Battery, Gauge, Layers, Radio, type LucideIcon } from "lucide-react";

type Criterion = {
  id: string;
  label: string;
  icon: LucideIcon;
  matter: string;
  zigbee: string;
};

const CRITERIA: Criterion[] = [
  {
    id: "speed",
    label: "Velocidade",
    icon: Gauge,
    matter: "Alta — comandos locais via Thread/Wi-Fi; menos dependência da nuvem",
    zigbee: "Muito alta — mesh dedicado com latência baixa entre sensores e atuadores",
  },
  {
    id: "range",
    label: "Alcance",
    icon: Radio,
    matter: "Bom — Thread estende malha; Wi-Fi depende do roteador",
    zigbee: "Excelente — cada dispositivo repete o sinal pela casa inteira",
  },
  {
    id: "compatibility",
    label: "Compatibilidade",
    icon: Layers,
    matter: "Padrão unificado — Apple, Google, Amazon e fabricantes no mesmo ecossistema",
    zigbee: "Ecossistema maduro — milhares de lâmpadas, sensores e fechaduras já no mercado",
  },
  {
    id: "energy",
    label: "Consumo de energia",
    icon: Battery,
    matter: "Muito baixo com Thread — ideal para sensores a pilha por anos",
    zigbee: "Baixo por design — rede mesh pensada para dispositivos econômicos",
  },
];

const DEFAULT_AUTHORITY_TITLE = "Por que o Echo Show 11 é um divisor de águas?";

const DEFAULT_AUTHORITY_BODY =
  "Por possuir rádio Zigbee integrado e suporte a Matter sobre Thread, este aparelho funciona como hub da casa: você pareia lâmpadas, sensores e fechaduras compatíveis direto na tela ou por voz — sem comprar hubs de terceiros (como os da Philips Hue ou Intelbras) para a maioria dos gadgets do dia a dia. É retrocompatibilidade com o que já existe no mercado, mais porta de entrada no padrão Matter que unifica o futuro.";

const CLOSING_LINE =
  "Curadoria Rocha Smart: Decisão baseada em dados, não em promessas.";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getConfig(meta: Prisma.JsonValue) {
  const root = (meta ?? {}) as Record<string, unknown>;
  const cfg = isRecord(root.protocolos_na_lupa) ? root.protocolos_na_lupa : {};
  const sh = isRecord(root.smart_home) ? root.smart_home : {};
  const protocols = Array.isArray(sh.protocols) ? (sh.protocols as string[]) : [];

  return {
    enabled: cfg.enabled,
    authorityTitle:
      typeof cfg.authority_title === "string" ? cfg.authority_title : DEFAULT_AUTHORITY_TITLE,
    authorityBody:
      typeof cfg.authority_body === "string" ? cfg.authority_body : DEFAULT_AUTHORITY_BODY,
    protocols,
  };
}

export function shouldShowProtocolosNaLupa(meta: Prisma.JsonValue): boolean {
  const { enabled, protocols } = getConfig(meta);
  if (enabled === false) return false;
  if (enabled === true) return true;
  const joined = protocols.join(" ").toLowerCase();
  return joined.includes("zigbee") || joined.includes("matter");
}

function CriterionRow({ row, isLast }: { row: Criterion; isLast: boolean }) {
  const Icon = row.icon;
  return (
    <tr className={isLast ? "" : "border-b border-white/[0.06]"}>
      <th
        scope="row"
        className="px-5 py-5 align-top font-medium text-zinc-300 sm:px-8 sm:py-6"
      >
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-emerald-400">
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <span
            className="pt-1 text-sm font-bold text-white"
            style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
          >
            {row.label}
          </span>
        </span>
      </th>
      <td className="px-4 py-5 align-top text-zinc-400 sm:px-6 sm:py-6">
        <span className="inline-block rounded-md border border-white/[0.04] bg-white/[0.02] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
          Matter
        </span>
        <p className="mt-2 leading-relaxed">{row.matter}</p>
      </td>
      <td className="px-4 py-5 align-top text-zinc-400 sm:px-8 sm:py-6">
        <span className="inline-block rounded-md border border-white/[0.04] bg-white/[0.02] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Zigbee
        </span>
        <p className="mt-2 leading-relaxed">{row.zigbee}</p>
      </td>
    </tr>
  );
}

export function ProtocolosNaLupaSection({ ai_metadata }: { ai_metadata: Prisma.JsonValue }) {
  if (!shouldShowProtocolosNaLupa(ai_metadata)) return null;

  const { authorityTitle, authorityBody } = getConfig(ai_metadata);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950"
      aria-labelledby="protocolos-na-lupa-heading"
    >
      <header className="border-b border-white/[0.06] px-5 py-7 sm:px-8 sm:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
          White paper simplificado
        </p>
        <h2
          id="protocolos-na-lupa-heading"
          className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
          style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
        >
          Protocolos na Lupa
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Matter e Zigbee não competem — cumprem papéis diferentes. Esta tabela resume o que importa
          antes de montar (ou expandir) sua automação.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th
                scope="col"
                className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 sm:px-8"
              >
                Critério
              </th>
              <th
                scope="col"
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 sm:px-6"
              >
                Matter
              </th>
              <th
                scope="col"
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 sm:px-8"
              >
                Zigbee
              </th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((row, index) => (
              <CriterionRow key={row.id} row={row} isLast={index === CRITERIA.length - 1} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/[0.06] px-5 py-8 sm:px-8 sm:py-10">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
            Box de autoridade
          </p>
          <h3
            className="mt-3 text-balance text-xl font-extrabold leading-snug text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
          >
            {authorityTitle}
          </h3>
          <p
            className="mt-4 text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base"
            style={{ fontFamily: "var(--font-rs-body, system-ui), sans-serif" }}
          >
            {authorityBody}
          </p>
        </div>
      </div>

      <footer className="border-t border-white/[0.06] bg-black/30 px-5 py-5 sm:px-8">
        <p
          className="text-center text-sm font-semibold tracking-tight text-zinc-500"
          style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
        >
          {CLOSING_LINE}
        </p>
      </footer>
    </section>
  );
}
