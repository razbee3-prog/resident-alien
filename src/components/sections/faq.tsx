import { Container, Heading, Section } from "@/components/ui";

export type FaqItem = { q: string; a: string };

export const defaultFaq: FaqItem[] = [
  {
    q: "Why “Resident Alien”?",
    a: "It’s what the IRS calls you on day one. We think you deserve a better card than a tax status.",
  },
  {
    q: "Do I need an SSN?",
    a: "Professionals get one through their employer; many students get one with on-campus work. If our card partner allows a passport or ITIN start, we’ll say so plainly. We won’t claim it until it’s true.",
  },
  {
    q: "Is this a secured card?",
    a: "Not by default. Secured is the fallback when the evidence doesn’t support a starter line yet, and we say so plainly, with the exact thing that unlocks the next step.",
  },
  {
    q: "Will you share my data with the government?",
    a: "We don’t sell data, and we don’t volunteer it. In the U.S., the Right to Financial Privacy Act generally requires legal process before a federal agency can get bank records, with exceptions. We’ll publish exactly what we’d be compelled to share and when. This isn’t legal advice.",
  },
  {
    q: "Are you Amex or Chase?",
    a: "No. We’re the on-ramp to the file they underwrite. We’re not affiliated with either, and nobody can guarantee an approval.",
  },
  {
    q: "What does “faster” actually mean?",
    a: "Fewer wasted months. No secured-card detour when your evidence supports a real line, no store cards, no early applications that stall the score. Not skipped payments, and not a shortcut around the 12–24 months a premium file needs.",
  },
];

export function Faq({ items = defaultFaq, title = "Questions people ask first." }: { items?: FaqItem[]; title?: string }) {
  return (
    <Section id="faq">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Heading eyebrow="FAQ" title={title} />
        <div className="divide-y divide-hairline border-y border-hairline">
          {items.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.05rem] font-medium leading-snug text-ink [&::-webkit-details-marker]:hidden">
                {it.q}
                <span
                  aria-hidden="true"
                  className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-hairline-strong text-muted transition-transform group-open:rotate-45"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-[40rem] text-[0.95rem] leading-relaxed text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
