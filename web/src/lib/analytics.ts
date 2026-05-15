"use client";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
};

export type PurchasePayload = {
  transaction_id: string;
  value: number;
  currency: string;
  tax?: number;
  shipping?: number;
  items?: AnalyticsItem[];
};

export type InitiateCheckoutPayload = {
  value: number;
  currency: string;
  items?: AnalyticsItem[];
  fbclid?: string | null;
  gclid?: string | null;
};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function getDataLayer(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** GA4 ecommerce clear (recommended before ecommerce pushes). */
function clearEcommerceDataLayer() {
  getDataLayer().push({ ecommerce: null });
}

/** Grava fbclid / gclid (e variantes) vindos da URL na sessão do navegador. */
export function persistClickIdsFromUrl() {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  const fb = sp.get("fbclid");
  const gc = sp.get("gclid") ?? sp.get("wbraid") ?? sp.get("gbraid");
  if (fb) window.sessionStorage.setItem("rs_fbclid", fb);
  if (gc) window.sessionStorage.setItem("rs_gclid", gc);
}

/**
 * Dispara `page_view` no dataLayer e nos pixels (Meta PageView + gtag page_view).
 */
export function trackPageView(payload: { page_path: string; page_title?: string }) {
  const page_title = payload.page_title ?? (typeof document !== "undefined" ? document.title : "");
  const base = {
    page_path: payload.page_path,
    page_title,
  };

  getDataLayer().push({
    event: "page_view",
    ...base,
  });

  window.gtag?.("event", "page_view", {
    page_path: payload.page_path,
    page_title,
  });

  window.fbq?.("track", "PageView");
}

/**
 * Início de checkout (funil afiliado / bridge): Meta `InitiateCheckout`, GA4 `begin_checkout` + dataLayer.
 */
export function trackInitiateCheckout(data: InitiateCheckoutPayload) {
  const items = data.items ?? [];
  const ecommerce = {
    currency: data.currency,
    value: data.value,
    items,
  };

  clearEcommerceDataLayer();
  getDataLayer().push({
    event: "initiate_checkout",
    ecommerce,
    fbclid: data.fbclid ?? undefined,
    gclid: data.gclid ?? undefined,
  });

  window.gtag?.("event", "begin_checkout", {
    currency: data.currency,
    value: data.value,
    items,
  });

  const contents = items.map((i) => ({
    id: i.item_id,
    quantity: i.quantity ?? 1,
    item_price: i.price,
  }));

  window.fbq?.("track", "InitiateCheckout", {
    value: data.value,
    currency: data.currency,
    content_ids: items.map((i) => i.item_id),
    contents,
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  });
}

export function trackPurchase(data: PurchasePayload) {
  const items = data.items ?? [];
  const ecommerce = {
    transaction_id: data.transaction_id,
    value: data.value,
    currency: data.currency,
    tax: data.tax,
    shipping: data.shipping,
    items,
  };

  clearEcommerceDataLayer();
  getDataLayer().push({
    event: "purchase",
    ecommerce,
  });

  window.gtag?.("event", "purchase", {
    transaction_id: data.transaction_id,
    value: data.value,
    currency: data.currency,
    tax: data.tax,
    shipping: data.shipping,
    items,
  });

  const contents = items.map((i) => ({
    id: i.item_id,
    quantity: i.quantity ?? 1,
    item_price: i.price,
  }));

  window.fbq?.("track", "Purchase", {
    value: data.value,
    currency: data.currency,
    content_ids: items.map((i) => i.item_id),
    contents,
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
  });
}
