import { SingleCard } from "@/components/card/single-card";
import { Coach } from "@/components/sections/coach";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";
import { Ladder, type Rung } from "@/components/sections/ladder";
import { ButtonLink, Container, Eyebrow, Heading, Section } from "@/components/ui";
import { segments, type Segment } from "@/lib/segments";
import { disclosures } from "@/lib/site";

function toRungs(timeline: { month: string; step: string }[]): Rung[] {
  return timeline.map((t) => {
    const i = t.month.indexOf(" ");
    return i > 0 ? { unit: t.month.slice(0, i), month: t.month.slice(i + 1), step: t.step } : { unit: "", month: t.month, step: t.step };
  });
}

export function SegmentPage({ segment }: { segment: Segment }) {
  const s = segments[segment];
  const other = segments[segment === "student" ? "professional" : "student"];
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10%] top-[-10%] h-[70%] w-[60%] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(135,133,255,.14), transparent 70%)" }}
        />
        <Container className="relative grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-rise">
            <Eyebrow>Resident Alien for {s.plural.toLowerCase()}</Eyebrow>
            <h1 className="mt-5 text-[2.6rem] font-bold leading-[1] tracking-[-0.035em] sm:text-[3.4rem] md:text-[4rem]">{s.headline}</h1>
            <p className="mt-7 max-w-[36rem] text-lg leading-relaxed text-muted md:text-xl">{s.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/waitlist">Join the waitlist</ButtonLink>
              <ButtonLink href="/demo" variant="ghost">
                Run the readiness demo
              </ButtonLink>
            </div>
            <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint">{disclosures.short}</p>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <SingleCard segment={segment} />
          </div>
        </Container>
      </section>

      <Section id="evidence">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Heading eyebrow="What we read" title="Evidence, not a score." lede={`A bureau sees nothing. We read what a ${s.label.toLowerCase()} actually arrives with.`} />
          <dl className="grid gap-px overflow-hidden rounded-[1.25rem] border border-hairline bg-hairline">
            <Row label="Evidence">
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
        </Container>
      </Section>

      <Ladder rungs={toRungs(s.timeline)} eyebrow="The timeline" title={`The ${s.label.toLowerCase()} path, month by month.`} lede="Typical, not promised. Every step depends on on-time payments and the evidence staying true." />

      <Coach />
      <Faq items={s.faq} title={`Questions ${s.plural.toLowerCase()} ask first.`} />

      <section className="border-t border-hairline py-10">
        <Container>
          <p className="text-sm text-muted">
            Not a {s.label.toLowerCase()}?{" "}
            <a href={other.href} className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink">
              See the {other.label.toLowerCase()} path
            </a>
            .
          </p>
        </Container>
      </section>
      <Cta />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 bg-surface p-6 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="eyebrow pt-1">{label}</dt>
      <dd className="text-[0.95rem] leading-relaxed text-ink/90">{children}</dd>
    </div>
  );
}
