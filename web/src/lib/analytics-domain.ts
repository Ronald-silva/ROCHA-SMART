import { getAnalyticsCookieDomain, getSiteUrl } from "@/lib/site-url";

/** Config compartilhada de first-party cookies para gtag (client). */
export function getGtagFirstPartyConfig(): {
  cookieDomain?: string;
  cookieFlags: string;
} {
  const cookieDomain = getAnalyticsCookieDomain(
    typeof window !== "undefined" ? window.location.origin : getSiteUrl(),
  );
  return {
    ...(cookieDomain ? { cookieDomain } : {}),
    cookieFlags: "SameSite=None;Secure",
  };
}

/** Serializa opções extras do `gtag('config', ...)` no script inline. */
export function gtagConfigExtrasScript(): string {
  const { cookieDomain, cookieFlags } = getGtagFirstPartyConfig();
  const parts: string[] = ["send_page_view: false"];
  if (cookieDomain) parts.push(`cookie_domain: '${cookieDomain}'`);
  parts.push(`cookie_flags: '${cookieFlags}'`);
  return `{ ${parts.join(", ")} }`;
}
