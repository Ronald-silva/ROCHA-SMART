"use client";

import { AFFILIATE_REDIRECT_MS, buildAffiliateUrlWithClickIds, getClickIdsForPayload } from "@/lib/affiliate";
import type { InitiateCheckoutPayload } from "@/lib/analytics";
import { trackInitiateCheckout } from "@/lib/analytics";

export type AffiliateCTAProps = {
  affiliateUrl: string;
  checkout: InitiateCheckoutPayload;
  label?: string;
};

/**
 * Bridge page: dispara InitiateCheckout (Meta + Google + dataLayer), preserva fbclid/gclid e redireciona após delay.
 */
export function AffiliateCTA({
  affiliateUrl,
  checkout,
  label = "Ir ao site oficial",
}: AffiliateCTAProps) {
  return (
    <button
      type="button"
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:scale-[0.99]"
      onClick={() => {
        const ids = getClickIdsForPayload();
        const target = buildAffiliateUrlWithClickIds(affiliateUrl, ids);
        trackInitiateCheckout({ ...checkout, ...ids });
        window.setTimeout(() => {
          window.location.assign(target);
        }, AFFILIATE_REDIRECT_MS);
      }}
    >
      {label}
    </button>
  );
}
