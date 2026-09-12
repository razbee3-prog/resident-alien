"use client";

import { useId, useState } from "react";
import { Dot, Slider, Tile } from "@/components/readiness/demo-teaser";
import { Pill } from "@/components/ui";
import { usd } from "@/lib/format";
import { assess, demoApplicant, demoStudent, type ReadinessInput } from "@/lib/readiness";
import type { Segment } from "@/lib/segments";

export function EngineUI() {
  const id = useId();
  const [input, setInput] = useState<ReadinessInput>(demoApplicant);
  const r = assess(input);
  const set = <K extends keyof ReadinessInput>(k: K, v: ReadinessInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const isStudent = input.segment === "student";

  return (
    <div className="panel grid overflow-hidden lg:grid-cols-[1fr_1.1fr]">
      <div className="bg-surface p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Inputs, all fictional</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput(demoApplicant)}>
              H-1B engineer preset
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInput(demoStudent)}>
              F-1 student preset
            </button>
          </div>
        </div>

        <div className="mt-6 flex h-11 rounded-xl border border-hairline bg-surface-2 p-1" role="group" aria-label="Segment">
          {(["professional", "student"] as Segment[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={input.segment === s}
              onClick={() => set("segment", s)}
              className={`flex-1 rounded-lg text-sm font-medium capitalize transition-colors ${input.segment === s ? "bg-ink text-ground" : "text-muted hover:text-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-7">
          <Slider id={`${id}-income`} label={isStudent ? "Annual funding (scholarship, sponsor, family)" : "Annual salary"} value={input.annualIncome} min={10000} max={250000} step={1000} onChange={(v) => set("annualIncome", v)} />
          <Slider id={`${id}-savings`} label="Savings in a U.S. account" value={input.savings} min={0} max={50000} step={250} onChange={(v) => set("savings", v)} />
          <Slider id={`${id}-rent`} label="Monthly rent" value={input.rent} min={0} max={5000} step={50} onChange={(v) => set("rent", v)} />
          <Slider id={`${id}-ess`} label="Monthly essentials" value={input.essentials} min={0} max={3000} step={50} onChange={(v) => set("essentials", v)} />
          <Slider id={`${id}-remit`} label="Sent home each month" value={input.remittance} min={0} max={3000} step={50} onChange={(v) => set("remittance", v)} />
          <Slider id={`${id}-days`} label={isStudent ? "Days until term starts" : "Days until start date"} value={input.daysToStart} min={0} max={120} step={1} onChange={(v) => set("daysToStart", v)} format={(n) => `${n} d`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label={isStudent ? "Funding disbursed" : "First payroll landed"} on={input.incomeStarted} onChange={(v) => set("incomeStarted", v)} />
            <Toggle label="Foreign credit on file" on={input.foreignCredit} onChange={(v) => set("foreignCredit", v)} />
          </div>
        </div>
      </div>

      <div className="grid grid-rows-[auto_auto_1fr] gap-px bg-hairline lg:border-l lg:border-hairline">
        <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-4">
          <div className="bg-surface p-5">
            <p className="eyebrow">Readiness</p>
            <Ring value={r.score} />
            <p className="mt-1 text-xs text-faint">of 100, not a FICO</p>
          </div>
          <Tile label="Path" value={r.pathLabel} small />
          <Tile label={r.path === "secured" ? "Deposit, illustrative" : "Line, illustrative"} value={r.limit ? usd(r.limit) : "—"} />
          <Tile label="Safe to send" value={usd(r.safeToSend)} note="this month" />
        </div>

        <div className="grid gap-px bg-hairline md:grid-cols-2">
          <div className="bg-surface p-6">
            <p className="eyebrow">Why</p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {r.reasons.map((x) => (
                <li key={x.text} className="flex gap-3 text-sm leading-relaxed text-ink/90">
                  <Dot tone={x.tone} />
                  {x.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface p-6">
            <p className="eyebrow">Numbers we used</p>
            <dl className="num mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted">Monthly income</dt>
              <dd className="text-right">{usd(r.monthlyIncome)}</dd>
              <dt className="text-muted">Monthly obligations</dt>
              <dd className="text-right">{usd(r.obligations)}</dd>
              <dt className="text-muted">Free after obligations</dt>
              <dd className="text-right">{Math.round(r.capacityRatio * 100)}%</dd>
              <dt className="text-muted">Runway before first pay</dt>
              <dd className="text-right">{r.runwayMonths >= 6 ? "6+" : r.runwayMonths.toFixed(1)} mo</dd>
            </dl>
            <p className="mt-5 border-t border-hairline pt-4 text-sm text-muted">
              <span className="text-ink">Next unlock. </span>
              {r.nextUnlock}
            </p>
            <p className="mt-3 text-sm text-muted">
              <span className="text-ink">Premium consideration. </span>
              {r.premiumEta}, at 720–740+.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap content-start items-start justify-between gap-3 bg-surface px-6 py-4">
          <p className="text-xs text-faint">
            Deterministic rules on the numbers above. No model approves anything; a model would only write these reasons in more words.
          </p>
          <Pill tone="warn">Demo only</Pill>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex h-11 items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-2 px-3.5 text-left text-sm text-ink"
    >
      {label}
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-white/15"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-2 flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#8785ff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset .5s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>
      <span className="num font-display text-[2.4rem] font-bold leading-none tracking-[-0.03em] text-accent">{value}</span>
    </div>
  );
}
