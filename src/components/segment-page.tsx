import { SingleCard } from "@/components/card/single-card";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";
import { Ladder, type Rung } from "@/components/sections/ladder";
import { ButtonLink, Container, Section } from "@/components/ui";
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
          className="pointer-events-none absolute left-1/2 top-[40%] h-[640px] w-[800px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(135,133,255,.14), transparent 70%)" }}
        />
        <Container className="relative pb-6 pt-16 text-center md:pt-24">
          <p className="text-sm text-muted">For {s.plural.toLowerCase()}</p>
          <h1 className="mx-auto mt-4 max-w-[14ch] text-[2.8rem] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[4rem] md:text-[5rem]">{s.headline}</h1>
          <p className="mx-auto mt-6 max-w-[30rem] text-lg leading-snug text-muted md:text-[1.25rem]">{s.sub}</p>
          <div className="mt-9 flex justify-center">
            <ButtonLink href="/waitlist" size="lg">
              Join the waitlist
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-faint">{disclosures.short}</p>
          <div className="mt-14">
            <SingleCard segment={segment} />
          </div>
        </Container>
      </section>

      <Section className="pt-10 md:pt-16">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="panel p-8">
              <p className="text-sm text-muted">What counts</p>
              <ul className="mt-4 flex flex-col gap-2 text-[1.05rem] font-medium text-ink">
                {s.evidence.slice(0, 3).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
            <div className="panel p-8">
              <p className="text-sm text-muted">To start, illustrative</p>
              <p className="num mt-4 font-display text-[2.4rem] font-bold leading-none tracking-[-0.04em]">{s.limit}</p>
            </div>
            <div className="panel p-8">
              <p className="text-sm text-muted">First unlock</p>
              <p className="mt-4 text-[1.05rem] font-medium text-ink">{s.unlock}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Ladder rungs={toRungs(s.timeline)} title="Month by month." lede="" />
      <Faq items={s.faq} title={`Questions ${s.plural.toLowerCase()} ask.`} />

      <section className="border-t border-hairline py-8">
        <Container>
          <p className="text-sm text-muted">
            Not a {s.label.toLowerCase()}?{" "}
            <a href={other.href} className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink">
              See the {other.label.toLowerCase()} card
            </a>
            .
          </p>
        </Container>
      </section>
      <Cta />
    </>
  );
}
