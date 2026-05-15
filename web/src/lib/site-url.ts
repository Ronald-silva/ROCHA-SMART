/** Domínio oficial de produção (Cloudflare → Vercel). */
export const PRODUCTION_SITE_URL = "https://rochasmart.com.br";

/**
 * URL canônica do site (SEO, sitemap, Open Graph, pixels).
 * Prioridade: `NEXT_PUBLIC_SITE_URL` → produção → localhost.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;
  return "http://localhost:3000";
}

/**
 * Domínio de cookie first-party para GA4 (ex.: `.rochasmart.com.br`).
 * Retorna `undefined` em localhost para o navegador usar o padrão.
 */
export function getAnalyticsCookieDomain(siteUrl?: string): string | undefined {
  try {
    const host = new URL(siteUrl ?? getSiteUrl()).hostname;
    if (!host || host === "localhost" || host === "127.0.0.1") return undefined;
    if (host.endsWith(".com.br")) {
      const parts = host.split(".");
      return `.${parts.slice(-3).join(".")}`;
    }
    const parts = host.split(".");
    if (parts.length >= 2) return `.${parts.slice(-2).join(".")}`;
    return host;
  } catch {
    return undefined;
  }
}
