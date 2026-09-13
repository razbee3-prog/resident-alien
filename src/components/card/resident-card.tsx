"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import type { Segment } from "@/lib/segments";
import { flagSrc, type Country } from "@/lib/countries";

type Props = {
  segment: Segment;
  country: Country;
  name?: string;
  arrived?: string;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const RESET = { "--rx": "0deg", "--ry": "0deg", "--mx": "50%", "--my": "30%", "--gx": "-22%" } as const;

export function ResidentCard({
  segment,
  country,
  name = "MAYA AMARI",
  arrived = "09 · 26",
  interactive = true,
  className = "",
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const setVars = useCallback((vars: Record<string, string>) => {
    const el = ref.current;
    if (!el) return;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  }, []);

  const onMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!interactive || reduced.current) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() =>
        setVars({
          "--ry": `${((x - 0.5) * 18).toFixed(2)}deg`,
          "--rx": `${((0.5 - y) * 16).toFixed(2)}deg`,
          "--mx": `${(x * 100).toFixed(1)}%`,
          "--my": `${(y * 100).toFixed(1)}%`,
          "--gx": `${((x - 0.5) * 70).toFixed(1)}%`,
        }),
      );
    },
    [interactive, setVars],
  );

  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setVars(RESET);
  }, [setVars]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div className={`rcard-scene ${className}`} style={style}>
      <div
        ref={ref}
        className={`rcard ${segment === "student" ? "rcard--student" : ""}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        role="img"
        aria-label={`Resident Alien ${segment} card for ${name}, from ${country.name}`}
      >
        <div className="rcard-face">
          <div className="rcard-gloss" aria-hidden="true" />
          <div className="rcard-spec" aria-hidden="true" />
          <div className="rcard-vignette" aria-hidden="true" />
          <div className="rcard-body">
            <div className="rcard-top">
              <span className="rcard-mark">RESIDENT ALIEN</span>
              <div className="rcard-pinwrap">
                <div className="rcard-pin">
                  <Image src={flagSrc(country.a2)} alt="" width={36} height={24} unoptimized draggable={false} />
                </div>
                <span className="rcard-from">{country.a3}</span>
              </div>
            </div>

            <div className="rcard-row">
              <div className="rcard-chip" aria-hidden="true">
                <ChipContacts />
              </div>
            </div>

            <div className="rcard-num">•••• •••• •••• 0001</div>

            <div className="rcard-bottom">
              <div>
                <div className="rcard-name">{name}</div>
                <div className="rcard-meta">ARRIVED {arrived}</div>
              </div>
              <Contactless />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipContacts() {
  return (
    <svg viewBox="0 0 46 36" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="44" height="34" rx="5" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <path d="M1 12h13M1 24h13M32 12h13M32 24h13M14 1v34M32 1v34" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <rect x="17" y="11" width="12" height="14" rx="3" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <path d="M2 2h42" stroke="rgba(255,255,255,.35)" strokeWidth="0.6" />
    </svg>
  );
}

function Contactless() {
  return (
    <svg className="rcard-wave" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6.5 8.5a6 6 0 0 1 0 7" />
      <path d="M9.5 6.5a9.5 9.5 0 0 1 0 11" />
      <path d="M12.5 4.5a13 13 0 0 1 0 15" />
      <path d="M15.5 2.5a16.5 16.5 0 0 1 0 19" />
    </svg>
  );
}
