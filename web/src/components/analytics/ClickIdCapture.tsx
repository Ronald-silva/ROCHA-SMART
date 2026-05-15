"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { persistClickIdsFromUrl } from "@/lib/analytics";

function Inner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    persistClickIdsFromUrl();
  }, [searchParams]);

  return null;
}

/** Persiste fbclid / gclid (e variantes) na landing para manter consistência no funil de afiliado. */
export function ClickIdCapture() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
