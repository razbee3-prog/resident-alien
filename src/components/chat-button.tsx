"use client";

import { useEffect, useRef, useState } from "react";
import { findCountry } from "@/lib/countries";
import { usePrefs } from "@/lib/prefs";

/**
 * "Chat with Credit Alien": an sms: deep link that opens Messages on iPhone, iPad, Mac, and Android with the
 * segment and country prefilled so the coach can skip a question. On other desktops it opens a panel with a QR
 * code and the number.
 */
export function ChatButton({ number, qrSvg, className = "" }: { number: string; qrSvg: string; className?: string }) {
  const prefs = usePrefs();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const country = findCountry(prefs.country);
  const who = prefs.segment === "student" ? "a student" : prefs.segment === "professional" ? "a professional" : "new here";
  const body = `Hi Credit Alien 👽 I'm ${who}${country ? ` from ${country.a3}` : ""}. Help me build U.S. credit.`;
  const href = `sms:${number}?&body=${encodeURIComponent(body)}`;
  const pretty = number.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "+1 ($1) $2-$3");

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <>
      <a
        href={href}
        className={`btn btn-ghost border-accent/40 hover:border-accent ${className}`}
        onClick={(e) => {
          // Messages exists on Apple platforms and Android; elsewhere show the QR panel instead of a dead link.
          if (!/iPhone|iPad|iPod|Macintosh|Android/i.test(navigator.userAgent)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
        </span>
        Chat with Credit Alien
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">iMessage</span>
      </a>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ground/80 p-6 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="chat-title" className="panel w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Credit Alien · iMessage</p>
            <h2 id="chat-title" className="mt-2 text-xl font-bold tracking-[-0.02em]">
              Text us from your phone.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Point your camera at the code, or text the number. Say where you’re from and whether you’re a student or a professional.</p>
            <div className="mx-auto mt-5 w-44 rounded-xl border border-hairline bg-surface-2 p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="num mt-5 text-center font-mono text-lg tracking-[0.06em]">{pretty}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" className="btn btn-primary btn-sm" onClick={copy}>
                {copied ? "Copied" : "Copy number"}
              </button>
              <a href={href} className="btn btn-ghost btn-sm">
                Open Messages anyway
              </a>
              <button ref={closeRef} type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-faint">Msg & data rates may apply. Reply STOP anytime.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
