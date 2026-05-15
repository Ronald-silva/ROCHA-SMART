"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#curadoria", label: "Vitrine" },
  { href: "/#faq", label: "Dúvidas" },
] as const;

/** Ícone hamburger → X: SVG com centro fixo no viewBox (sem drift de transform). */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none block shrink-0"
      aria-hidden
    >
      <g className="transition-opacity duration-200 ease-out" style={{ opacity: open ? 0 : 1 }}>
        <path d="M5 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 16h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="transition-opacity duration-200 ease-out" style={{ opacity: open ? 1 : 0 }}>
        <path d="M7 7l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030306]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#030306]/85">
      {open ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-14 z-40 cursor-default border-0 bg-black/55 backdrop-blur-[2px] sm:top-16 md:hidden"
          aria-hidden
          tabIndex={-1}
          onClick={close}
        />
      ) : null}

      <div className="relative z-50 mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-8">
        <Link
          href="/"
          className="shrink-0 text-sm font-extrabold tracking-tight text-white sm:text-base"
          style={{ fontFamily: "var(--font-rs-display), system-ui, sans-serif" }}
          onClick={close}
        >
          Rocha Smart
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Navegação principal"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/60 md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Fechar menu de navegação" : "Abrir menu de navegação"}
          onClick={() => setOpen((v) => !v)}
        >
          <HamburgerIcon open={open} />
        </button>
      </div>

      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        aria-hidden={!open}
        className={`fixed left-0 right-0 top-14 z-[45] max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto border-b border-white/10 bg-[#0a0a0e]/98 shadow-xl backdrop-blur-xl transition duration-200 ease-out sm:top-16 md:hidden ${
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-4 py-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ul className="divide-y divide-white/5">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-3.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06]"
                  onClick={close}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
