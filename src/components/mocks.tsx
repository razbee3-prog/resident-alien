/* Product UI mocks. Real-looking screens beat icons. All figures illustrative. */

export function EvidenceMock() {
  const rows = [
    { k: "Offer letter", v: "Verified", ok: true },
    { k: "Start date", v: "Oct 6, 2026", ok: true },
    { k: "Savings", v: "$9,000", ok: true },
    { k: "First payroll", v: "Pending", ok: false },
  ];
  return (
    <div className="mock">
      <div className="mock-bar">
        <span>Your evidence</span>
        <span className="rounded-full border border-good/40 px-2 py-0.5 text-[0.68rem] text-good">Approved</span>
      </div>
      {rows.map((r) => (
        <div key={r.k} className="mock-row">
          <span className="text-muted">{r.k}</span>
          <span className={`flex items-center gap-2 ${r.ok ? "text-ink" : "text-faint"}`}>
            {r.v}
            {r.ok ? <Check /> : <span className="h-3.5 w-3.5 rounded-full border border-hairline-strong" aria-hidden="true" />}
          </span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 px-4 py-4">
        <span className="text-sm text-muted">Starting line</span>
        <span className="num font-display text-[1.75rem] font-bold tracking-[-0.03em]">$1,500</span>
      </div>
    </div>
  );
}

export function CoachMock() {
  const pts = [668, 681, 690, 702];
  const W = 320;
  const H = 96;
  const y = (s: number) => 10 + (1 - (s - 650) / 70) * (H - 20);
  const x = (i: number) => 8 + (i / (pts.length - 1)) * (W - 16);
  const d = pts.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(" ");
  return (
    <div className="mock">
      <div className="mock-bar">
        <span>Alien Intelligence</span>
        <span>Month 9</span>
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted">Score, illustrative</p>
            <p className="num font-display text-[2.4rem] font-bold leading-none tracking-[-0.03em]">702</p>
          </div>
          <p className="num text-sm text-good">+34 since first score</p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" aria-hidden="true">
          <defs>
            <linearGradient id="coach-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8785ff" stopOpacity=".3" />
              <stop offset="1" stopColor="#8785ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${x(pts.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`} fill="url(#coach-fill)" />
          <path d={d} fill="none" stroke="#8785ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="4" fill="#8785ff" stroke="#141419" strokeWidth="2" />
        </svg>
      </div>
      <div className="mock-row">
        <span className="flex items-center gap-2 text-ink/90">
          <Check /> Autopay covers the $212 statement on the 14th.
        </span>
      </div>
      <div className="mock-row">
        <span className="flex items-center gap-2 text-ink/90">
          <Warn /> Utilization hit 14%. Pay $60 before Friday to stay under 10%.
        </span>
      </div>
      <div className="mock-row">
        <span className="text-muted">Ready for a mid-tier card</span>
        <span className="num text-ink">Est. Mar 2027</span>
      </div>
    </div>
  );
}

export function TransferMock() {
  return (
    <div className="mock">
      <div className="mock-bar">
        <span>Send home</span>
        <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[0.68rem] text-accent">Scheduled</span>
      </div>
      <div className="px-4 pt-4">
        <p className="text-xs text-muted">Every 1st of the month</p>
        <p className="num mt-1 font-display text-[2.2rem] font-bold leading-none tracking-[-0.03em]">
          $400 <span className="text-[1.1rem] font-medium text-muted">→ Guadalajara, MX</span>
        </p>
      </div>
      <div className="mock-row mt-3">
        <span className="text-muted">They receive</span>
        <span className="num text-ink">MX$7,312</span>
      </div>
      <div className="mock-row">
        <span className="text-muted">Fee, shown up front</span>
        <span className="num text-ink">$2.99</span>
      </div>
      <div className="mock-row">
        <span className="text-muted">Funded from</span>
        <span className="text-ink">Resident Alien account</span>
      </div>
      <div className="mock-row">
        <span className="text-muted">Next transfer</span>
        <span className="num text-ink">Oct 1</span>
      </div>
    </div>
  );
}

export function Check() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-good" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Warn() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-warn" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5v5M7 10.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
