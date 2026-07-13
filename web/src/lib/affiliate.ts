"use client";

export const AFFILIATE_REDIRECT_MS = 1200;

export type ClickIds = {
  fbclid: string | null;
  gclid: string | null;
};

export function getClickIdsForPayload(): ClickIds {
  if (typeof window === "undefined") {
    return { fbclid: null, gclid: null };
  }
  const fromStorage: ClickIds = {
    fbclid: window.sessionStorage.getItem("rs_fbclid"),
    gclid: window.sessionStorage.getItem("rs_gclid"),
  };
  const sp = new URLSearchParams(window.location.search);
  const fb = sp.get("fbclid") ?? fromStorage.fbclid;
  const gc =
    sp.get("gclid") ?? sp.get("wbraid") ?? sp.get("gbraid") ?? fromStorage.gclid;
  return { fbclid: fb, gclid: gc };
}

const FORWARDABLE_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function isSafeTrackingValue(value: string | null): value is string {
  return Boolean(value && value.length <= 512 && /^[A-Za-z0-9._~-]+$/.test(value));
}

/** Cria uma URL first-party: o destino externo só é resolvido e validado no servidor. */
export function buildOfferRedirectUrl(offerId: string, ids: ClickIds): string {
  const search = new URLSearchParams();
  if (isSafeTrackingValue(ids.fbclid)) search.set("fbclid", ids.fbclid);
  if (isSafeTrackingValue(ids.gclid)) search.set("gclid", ids.gclid);
  if (typeof window !== "undefined") {
    const incoming = new URLSearchParams(window.location.search);
    for (const key of FORWARDABLE_PARAMS) {
      const value = incoming.get(key);
      if (isSafeTrackingValue(value)) search.set(key, value);
    }
  }
  const suffix = search.size ? `?${search.toString()}` : "";
  return `/go/${encodeURIComponent(offerId)}${suffix}`;
}
