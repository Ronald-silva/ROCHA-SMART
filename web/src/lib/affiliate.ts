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

/** Anexa ids de clique à URL do parceiro (quando ainda não existirem). */
export function buildAffiliateUrlWithClickIds(target: string, ids: ClickIds): string {
  try {
    const u = new URL(target);
    if (ids.fbclid && !u.searchParams.has("fbclid")) {
      u.searchParams.set("fbclid", ids.fbclid);
    }
    if (ids.gclid && !u.searchParams.has("gclid")) {
      u.searchParams.set("gclid", ids.gclid);
    }
    return u.toString();
  } catch {
    return target;
  }
}
