import { Container, Heading, Pill, Section } from "@/components/ui";

const points = [
  { t: "Weekly actions.", b: "What to charge, when to pay, where to cap utilization. We say 10%, not 30%." },
  { t: "Alerts before damage.", b: "Missed autopay, utilization creeping up, an application you shouldn’t submit, your 5/24 count." },
  { t: "Reporting check.", b: "We confirm the bureaus received the right file under the right identifiers." },
  { t: "The readiness call.", b: "The month you look ready for mid-tier, and the month for premium. Not before." },
];

export function Coach() {
  return (
    <Section id="coach">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <Heading eyebrow="AI coach" title="A coach, not a chatbot." />
          <ul className="mt-10 flex flex-col gap-5">
            {points.map((p) => (
              <li key={p.t} className="grid gap-1 border-l border-hairline-strong pl-5">
                <p className="font-medium text-ink">{p.t}</p>
                <p className="text-[0.95rem] leading-relaxed text-muted">{p.b}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-[34rem] font-display text-[1.35rem] font-semibold leading-snug tracking-[-0.015em]">
            We don’t hand you Platinum. We make you the borrower Platinum and Reserve approve.
          </p>
        </div>
        <Dashboard />
      </Container>
    </Section>
  );
}

function Dashboard() {
  // Illustrative file, month 9 after a professional starter line.
  const points = [
    { m: 6, s: 668 },
    { m: 7, s: 681 },
    { m: 8, s: 690 },
    { m: 9, s: 702 },
  ];
  const W = 420;
  const H = 130;
  const padX = 8;
  const padY = 12;
  const min = 650;
  const max = 720;
  const x = (i: number) => padX + (i / (points.length - 1)) * (W - padX * 2);
  const y = (s: number) => padY + (1 - (s - min) / (max - min)) * (H - padY * 2);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.s).toFixed(1)}`).join(" ");
  const area = `${d} L${x(points.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`;
  const last = points[points.length - 1];

  return (
    <div className="panel overflow-hidden" aria-label="Illustrative coach dashboard">
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4">
        <div>
          <p className="eyebrow">Maya’s file</p>
          <p className="mt-1 text-sm text-ink">Professional starter line · reporting since Day 0</p>
        </div>
        <Pill>Month 9</Pill>
      </div>

      <div className="grid gap-px bg-hairline md:grid-cols-[1.4fr_1fr]">
        <div className="bg-surface p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Score trend · FICO 8, illustrative</p>
              <p className="num mt-1 font-display text-[2.6rem] font-bold leading-none tracking-[-0.03em]">{last.s}</p>
            </div>
            <p className="num text-sm text-good">+34 since first score</p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full" role="img" aria-label="Score rising from 668 in month 6 to 702 in month 9">
            <defs>
              <linearGradient id="coach-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8785ff" stopOpacity=".35" />
                <stop offset="1" stopColor="#8785ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[660, 680, 700].map((g) => (
              <g key={g}>
                <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="rgba(255,255,255,.08)" strokeDasharray="2 4" />
                <text x={W - padX} y={y(g) - 4} textAnchor="end" fill="#5c5c68" fontSize="10" fontFamily="var(--font-mono)">
                  {g}
                </text>
              </g>
            ))}
            <path d={area} fill="url(#coach-area)" />
            <path d={d} fill="none" stroke="#8785ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={p.m} cx={x(i)} cy={y(p.s)} r={i === points.length - 1 ? 4.5 : 2.5} fill={i === points.length - 1 ? "#8785ff" : "#141419"} stroke="#8785ff" strokeWidth="1.5" />
            ))}
            {points.map((p, i) => (
              <text key={`l${p.m}`} x={x(i)} y={H - 1} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fill="#5c5c68" fontSize="10" fontFamily="var(--font-mono)">
                M{p.m}
              </text>
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-px bg-hairline md:grid-cols-1">
          <Stat label="Utilization" value="8%" note="cap 10%" tone="good" />
          <Stat label="On-time" value="9/9" note="statements" tone="good" />
          <Stat label="Chase 5/24" value="1/5" note="last 24 mo" tone="muted" />
        </div>
      </div>

      <div className="grid gap-px border-t border-hairline bg-hairline md:grid-cols-2">
        <div className="bg-surface p-6">
          <p className="eyebrow">Readiness</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm">
            <Ready state="ready" label="Mainstream cash-back" note="Ready now" />
            <Ready state="soon" label="Mid-tier travel" note="Est. Mar 2027" />
            <Ready state="not" label="Platinum / Reserve" note="Est. Nov 2027" />
          </ul>
        </div>
        <div className="bg-surface p-6">
          <p className="eyebrow">This week</p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink/90">
            <li className="flex gap-3"><Check /> Autopay covers the $212 statement on the 14th.</li>
            <li className="flex gap-3"><Check /> Keep spend under $150 this cycle.</li>
            <li className="flex gap-3"><Warn /> Utilization drifted to 14% last cycle. Pay $60 before the statement closes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string; note: string; tone: "good" | "muted" }) {
  return (
    <div className="bg-surface p-5">
      <p className="eyebrow">{label}</p>
      <p className={`num mt-1 font-display text-[1.7rem] font-bold leading-none tracking-[-0.02em] ${tone === "good" ? "text-good" : "text-ink"}`}>{value}</p>
      <p className="mt-1 text-xs text-faint">{note}</p>
    </div>
  );
}

function Ready({ state, label, note }: { state: "ready" | "soon" | "not"; label: string; note: string }) {
  const dot = state === "ready" ? "bg-good" : state === "soon" ? "bg-warn" : "bg-faint";
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        <span className="text-ink/90">{label}</span>
      </span>
      <span className={`num text-xs ${state === "ready" ? "text-good" : "text-muted"}`}>{note}</span>
    </li>
  );
}

function Check() {
  return (
    <svg className="mt-[3px] h-3.5 w-3.5 shrink-0 text-good" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Warn() {
  return (
    <svg className="mt-[3px] h-3.5 w-3.5 shrink-0 text-warn" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5v5M7 10.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
