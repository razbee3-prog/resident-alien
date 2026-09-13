import { SingleCard } from "@/components/card/single-card";
import { ProductHero, Points } from "@/components/product-hero";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";
import { Ladder, type Rung } from "@/components/sections/ladder";
import { Container } from "@/components/ui";
import { segments, type Segment } from "@/lib/segments";

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
      <ProductHero kicker={`${s.label} card`} title={s.headline} sub={s.sub} visual={<SingleCard segment={segment} />} />
      <Points
        title="What counts as evidence."
        items={[
          { t: "We read", b: s.evidence.join(", ") + "." },
          { t: "Starting line", b: `${s.limit}, illustrative. Sized to your capacity after rent and essentials, not to a score you don’t have yet.` },
          { t: "First unlock", b: s.unlock + "." },
          { t: "The coach’s focus", b: s.coachFocus },
          { t: "The risk we plan for", b: s.risk },
        ]}
      />
      <Ladder rungs={toRungs(s.timeline)} title="Month by month." />
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
