"use client";

import { useState } from "react";

import { AFFILIATE_REDIRECT_MS, buildOfferRedirectUrl, getClickIdsForPayload } from "@/lib/affiliate";
import type { InitiateCheckoutPayload } from "@/lib/analytics";
import { trackInitiateCheckout } from "@/lib/analytics";

export type AffiliateCTAProps = {
  offerId: string;
  checkout: InitiateCheckoutPayload;
  label?: string;
};

/**
 * Bridge page: dispara InitiateCheckout (Meta + Google + dataLayer) e usa redirecionamento first-party validado no servidor.
 */
export function AffiliateCTA({
  offerId,
  checkout,
  label = "Ir ao site oficial",
}: AffiliateCTAProps) {
  const [opening, setOpening] = useState(false);
  return (
    <button
      type="button"
      disabled={opening}
      aria-live="polite"
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:scale-[0.99]"
      onClick={() => {
        if (opening) return;
        setOpening(true);
        const ids = getClickIdsForPayload();
        const target = buildOfferRedirectUrl(offerId, ids);
        trackInitiateCheckout({ ...checkout, ...ids });
        window.setTimeout(() => {
          window.location.assign(target);
        }, AFFILIATE_REDIRECT_MS);
      }}
    >
      {opening ? "Abrindo oferta…" : label}
    </button>
  );
}
