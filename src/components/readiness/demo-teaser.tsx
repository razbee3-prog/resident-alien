"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Arrow, Container, Heading, Pill, Section } from "@/components/ui";
import { usd } from "@/lib/format";
import { assess, demoApplicant, type Tone } from "@/lib/readiness";
import { disclosures } from "@/lib/site";

export function DemoTeaser() {
  const id = useId();
  const [rent, setRent] = useState(demoApplicant.rent);
  const [remit, setRemit] = useState(demoApplicant.remittance);
  const r = assess({ ...demoApplicant, rent, remittance: remit });

  return (
    <Section id="demo">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Heading
            eyebrow="Live demo"
            title="Move the rent. Watch the file."
            lede="A conventional lender sees no U.S. file and stops. This engine reads a fictional H-1B engineer’s evidence and shows a path, with reasons in plain English."
          />
          <Pill tone="warn">Demo only · not a credit decision</Pill>
        </div>

        <div className="panel mt-12 grid overflow-hidden lg:grid-cols-[1fr_1.2fr]">
          <div className="bg-surface p-7 md:p-8">
            <p className="eyebrow">Applicant, fictional</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {["H-1B software engineer", "$110,000 salary", "Starts in 21 days", "$9,000 savings", "Payroll not yet", "No foreign credit"].map((c) => (
                <li key={c} className="rounded-full border border-hairline-strong px-3 py-1.5 font-mono text-[0.68rem] tracking-[0.06em] text-ink/90">
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-7">
              <Slider id={`${id}-rent`} label="Monthly rent" value={rent} min={800} max={4000} step={50} onChange={setRent} />
              <Slider id={`${id}-remit`} label="Sent home each month" value={remit} min={0} max={2000} step={50} onChange={setRemit} />
              <p className="text-sm text-muted">Essentials fixed at {usd(demoApplicant.essentials)}. The full demo lets you change everything.</p>
            </div>
          </div>

          <div className="grid grid-rows-[auto_1fr] gap-px border-t border-hairline bg-hairline lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-4">
              <Tile label="Readiness" value={String(r.score)} note="of 100, not a FICO" big />
              <Tile label="Path" value={r.pathLabel} small />
              <Tile label="Illustrative line" value={r.limit ? usd(r.limit) : "—"} />
              <Tile label="Safe to send" value={usd(r.safeToSend)} note="this month" />
            </div>
            <div className="bg-surface p-7 md:p-8">
              <p className="eyebrow">Why</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {r.reasons.slice(0, 4).map((x) => (
                  <li key={x.text} className="flex gap-3 text-sm leading-relaxed text-ink/90">
                    <Dot tone={x.tone} />
                    {x.text}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-hairline pt-4 text-sm text-muted">
                <span className="text-ink">Next unlock. </span>
                {r.nextUnlock}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint">{disclosures.demo}</p>
          <Link href="/demo" className="group inline-flex items-center gap-2 text-sm font-medium text-ink">
            Open the full readiness engine <Arrow className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = usd,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm text-muted">
          {label}
        </label>
        <output htmlFor={id} className="num font-display text-xl font-bold tracking-[-0.02em]">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider mt-3 w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}

export function Tile({ label, value, note, big, small }: { label: string; value: string; note?: string; big?: boolean; small?: boolean }) {
  return (
    <div className="bg-surface p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={`num mt-1.5 font-display font-bold leading-none tracking-[-0.03em] ${
          big ? "text-[2.6rem] text-accent" : small ? "text-[1.05rem] leading-snug" : "text-[1.6rem]"
        }`}
      >
        {value}
      </p>
      {note ? <p className="mt-1.5 text-xs text-faint">{note}</p> : null}
    </div>
  );
}

export function Dot({ tone }: { tone: Tone }) {
  const c = tone === "good" ? "bg-good" : tone === "warn" ? "bg-warn" : tone === "bad" ? "bg-bad" : "bg-faint";
  return <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${c}`} aria-hidden="true" />;
}
