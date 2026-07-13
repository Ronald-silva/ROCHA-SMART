"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

type Props = {
  images: string[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);

  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex aspect-[4/3] items-center justify-center p-6 sm:p-8">
          <Image
            key={active}
            src={images[active]}
            alt={`${alt} — foto ${active + 1} de ${images.length}`}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-contain p-6 sm:p-8"
            fetchPriority={active === 0 ? "high" : "auto"}
            unoptimized
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Ir para imagem ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-5 bg-emerald-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-zinc-900 transition ${
                i === active
                  ? "border-emerald-500 ring-1 ring-emerald-500/40"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
