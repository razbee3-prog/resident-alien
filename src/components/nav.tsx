"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Logo } from "@/components/ui";
import { nav } from "@/lib/site";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-ground/70 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 text-ink" aria-label="Resident Alien home">
          <Logo className="text-ink" />
          <span className="font-mono text-[0.78rem] uppercase tracking-[0.2em]">Resident Alien</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
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
          <Link href="/waitlist" className="btn btn-primary btn-sm hidden sm:inline-flex">
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
        <div id="mobile-nav" className="border-t border-hairline bg-ground md:hidden">
          <Container className="flex flex-col py-4">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="py-3 text-lg text-ink" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/waitlist" className="btn btn-primary mt-3" onClick={() => setOpen(false)}>
              Join the waitlist
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
