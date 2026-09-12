import Link from "next/link";
import { Arrow, Container, Heading, Section } from "@/components/ui";
import { segments } from "@/lib/segments";

export function TwoPaths() {
  const cols = [segments.student, segments.professional];
  return (
    <Section id="paths">
      <Container>
        <Heading eyebrow="Two paths" title="Same destination. Different evidence." />
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {cols.map((s) => (
            <article key={s.key} className="panel flex flex-col p-7 md:p-9">
              <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-5">
                <h3 className="text-[1.6rem] font-bold tracking-[-0.02em]">{s.plural}</h3>
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">{s.pill}</span>
              </div>
              <dl className="mt-6 grid gap-5">
                <Row label="What we read">
                  <ul className="flex flex-col gap-1">
                    {s.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </Row>
                <Row label="Starter line, illustrative">
                  <span className="num font-display text-2xl font-bold tracking-[-0.02em]">{s.limit}</span>
                </Row>
                <Row label="First unlock">{s.unlock}</Row>
                <Row label="Coach focus">{s.coachFocus}</Row>
                <Row label="Risk we plan for">{s.risk}</Row>
              </dl>
              <Link
                href={s.href}
                className="group mt-8 inline-flex items-center gap-2 self-start text-sm font-medium text-ink"
              >
                See the {s.label.toLowerCase()} path <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[11rem_1fr] sm:gap-6">
      <dt className="eyebrow pt-1">{label}</dt>
      <dd className="text-[0.95rem] leading-relaxed text-ink/90">{children}</dd>
    </div>
  );
}
