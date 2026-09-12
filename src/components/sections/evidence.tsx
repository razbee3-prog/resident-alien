import { Container, Heading, Section } from "@/components/ui";

const chips = [
  "Offer letter",
  "Payroll",
  "I-20",
  "Sponsor funds",
  "Savings",
  "Foreign credit (optional)",
  "Rent and remittance obligations",
];

export function Evidence() {
  return (
    <Section id="evidence">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Heading eyebrow="Evidence translation" title="We read what you actually have." />
        <div className="flex flex-col gap-7 lg:pt-2">
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c} className="rounded-full border border-hairline-strong bg-surface px-3.5 py-2 font-mono text-[0.72rem] tracking-[0.06em] text-ink">
                {c}
              </li>
            ))}
          </ul>
          <p className="max-w-[36rem] text-lg leading-relaxed text-muted">
            A conventional lender sees no U.S. file and stops. We see a verified job or enrollment, real savings, and real
            obligations, then show a path. We don’t invent a credit score. We translate evidence.
          </p>
        </div>
      </Container>
    </Section>
  );
}
