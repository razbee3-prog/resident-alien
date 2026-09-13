"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container, Logo } from "@/components/ui";
import { nav, productMenu } from "@/lib/site";

const productPaths = productMenu.flatMap((g) => g.items.map((i) => i.href));

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState(false);
  const closeTimer = useRef(0);
  const waitlistHref = pathname === "/" ? "#waitlist" : "/waitlist";
  const productActive = productPaths.includes(pathname);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProduct(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product]);

  function openProduct() {
    window.clearTimeout(closeTimer.current);
    setProduct(true);
  }
  function closeProductSoon() {
    closeTimer.current = window.setTimeout(() => setProduct(false), 140);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-ground/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 text-ink" aria-label="Resident Alien home" onClick={() => setProduct(false)}>
          <Logo className="text-ink" />
          <span className="font-mono text-[0.78rem] uppercase tracking-[0.2em]">Resident Alien</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          <div className="relative" onMouseEnter={openProduct} onMouseLeave={closeProductSoon}>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 text-[0.9rem] transition-colors ${productActive || product ? "text-ink" : "text-muted hover:text-ink"}`}
              aria-expanded={product}
              aria-haspopup="true"
              onClick={() => setProduct((v) => !v)}
            >
              Product
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className={`transition-transform ${product ? "rotate-180" : ""}`}>
                <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {product ? (
              <div className="absolute left-1/2 top-[calc(100%+18px)] w-[720px] -translate-x-1/2" onMouseEnter={openProduct} onMouseLeave={closeProductSoon}>
                <div className="grid grid-cols-[1.35fr_1fr_1fr] divide-x divide-hairline overflow-hidden rounded-2xl border border-hairline-strong bg-surface shadow-[0_40px_80px_-30px_rgba(0,0,0,.95)]">
                  {productMenu.map((g) => (
                    <div key={g.title} className="p-5">
                      <p className="text-xs font-medium text-muted">{g.title}</p>
                      <ul className="mt-3 flex flex-col gap-1">
                        {g.items.map((it) => (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              onClick={() => setProduct(false)}
                              className="-mx-2 block rounded-lg px-2 py-2 transition-colors hover:bg-white/[.05]"
                            >
                              <span className="block text-[0.95rem] font-medium text-ink">{it.label}</span>
                              <span className="block text-[0.8rem] text-muted">{it.desc}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[0.9rem] transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href={waitlistHref} className="btn btn-primary btn-sm hidden sm:inline-flex">
            Join the waitlist
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </Container>

      {open ? (
        <div id="mobile-nav" className="max-h-[calc(100vh-4rem)] overflow-auto border-t border-hairline bg-ground md:hidden">
          <Container className="flex flex-col py-4">
            {productMenu.map((g) => (
              <div key={g.title} className="border-b border-hairline py-3">
                <p className="text-xs font-medium text-muted">{g.title}</p>
                {g.items.map((it) => (
                  <Link key={it.href} href={it.href} className="block py-2 text-lg text-ink" onClick={() => setOpen(false)}>
                    {it.label}
                  </Link>
                ))}
              </div>
            ))}
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="py-3 text-lg text-ink" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href={waitlistHref} className="btn btn-primary mt-3" onClick={() => setOpen(false)}>
              Join the waitlist
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
