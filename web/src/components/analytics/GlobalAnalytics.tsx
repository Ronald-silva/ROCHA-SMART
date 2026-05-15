"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackPageView } from "@/lib/analytics";
import { gtagConfigExtrasScript } from "@/lib/analytics-domain";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function PageViewListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    const page_path = qs ? `${pathname}?${qs}` : pathname;
    trackPageView({ page_path });
  }, [pathname, searchParams]);

  return null;
}

export function GlobalAnalytics() {
  const hasGtag = Boolean(GA4_ID || GOOGLE_ADS_ID);
  const primaryGtagSrcId = GA4_ID || GOOGLE_ADS_ID;
  const gtagExtras = gtagConfigExtrasScript();

  return (
    <>
      {META_PIXEL_ID ? (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
            `}
          </Script>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`fbq('init', '${META_PIXEL_ID}', {}, { autoConfig: true });`}
          </Script>
          {/* Verifique rochasmart.com.br em Meta Events Manager → Configurações do pixel (first-party). */}
        </>
      ) : null}

      {hasGtag && primaryGtagSrcId ? (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${primaryGtagSrcId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {hasGtag ? (
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            ${GA4_ID ? `gtag('config', '${GA4_ID}', ${gtagExtras});` : ""}
            ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}', ${gtagExtras});` : ""}
          `}
        </Script>
      ) : (
        <Script id="dataLayer-only" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];`}
        </Script>
      )}

      <Suspense fallback={null}>
        <PageViewListener />
      </Suspense>
    </>
  );
}
