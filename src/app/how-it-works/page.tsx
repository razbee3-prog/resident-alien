import type { Metadata } from "next";
import { Coach } from "@/components/sections/coach";
import { Cta } from "@/components/sections/cta";
import { Evidence } from "@/components/sections/evidence";
import { Faq } from "@/components/sections/faq";
import { Ladder } from "@/components/sections/ladder";
import { Container, Eyebrow, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "Connect evidence, get a starter line, follow the plan, hit the readiness checkpoint. Four steps from an empty U.S. file to premium-card eligibility.",
};

const steps = [
  {
    n: "01",
    t: "Connect evidence",
    b: "Offer letter or I-20, payroll or funding, a U.S. bank account, savings. Optional: foreign credit through a partner bureau. Ten minutes, documents you already have.",
  },
  {
    n: "02",
    t: "Get the starter line",
    b: "A controlled unsecured line sized to your capacity, a lower-limit line, or a secured fallback. You see which, and exactly why, in plain English. Every option reports to the bureaus.",
  },
  {
    n: "03",
    t: "Follow the plan",
    b: "One recurring bill on autopay. Utilization capped at 10%. No applications until the coach says the file is ready. Alerts before anything goes wrong, not after.",
  },
  {
    n: "04",
    t: "Hit the checkpoint",
    b: "Around month 6 the first score appears. Around 9–12, the mainstream card. At 12–24 months, with 720–740+ and a clean history, the coach tells you Platinum or Reserve is worth applying for.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <Eyebrow>How it works</Eyebrow>
          <h1 className="mt-5 max-w-[16ch] text-[2.6rem] font-bold leading-[1] tracking-[-0.035em] sm:text-[3.4rem] md:text-[4rem]">
            Connect evidence. Get a line. Follow the plan. Hit the checkpoint.
          </h1>
          <ol className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="panel flex flex-col gap-4 p-7">
                <span className="num font-mono text-[0.72rem] tracking-[0.14em] text-accent">{s.n}</span>
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.015em]">{s.t}</h2>
                <p className="text-[0.95rem] leading-relaxed text-muted">{s.b}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <Evidence />
      <Coach />
      <Ladder />
      <Section>
        <Container>
          <div className="panel grid gap-6 p-7 md:grid-cols-3 md:p-9">
            {[
              { t: "What the AI does", b: "Plans, explains, alerts, and reads evidence. It writes the reasons you see." },
              { t: "What it never does", b: "Approve credit on its own, set policy, or invent the legally required reasons for a decline." },
              { t: "What we won’t claim", b: "A guaranteed score, limit, or approval. An affiliation with Amex or Chase. That this is legal or immigration advice." },
            ].map((x) => (
              <div key={x.t}>
                <p className="eyebrow">{x.t}</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/90">{x.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <Faq />
      <Cta />
    </>
  );
}
