import { Container, Section } from "@/components/ui";

const items = [
  { n: "Day 0", t: "Apply before you land.", b: "A signed offer or an I-20 is enough to open your line." },
  { n: "6 mo", t: "Build from day one.", b: "Every payment reports to the U.S. bureaus. First score in about six months." },
  { n: "12–24 mo", t: "Get to Platinum faster.", b: "A clear path to Amex Platinum or Chase Sapphire Reserve eligibility." },
];

export function Benefits() {
  return (
    <Section className="pt-10 md:pt-16">
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.n} className="panel p-8">
              <p className="num font-display text-[2.6rem] font-bold leading-none tracking-[-0.04em] text-accent">{it.n}</p>
              <h2 className="mt-5 text-[1.45rem] font-semibold leading-tight tracking-[-0.02em]">{it.t}</h2>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">{it.b}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-faint">Timelines are typical, not promised. Card names are trademarks of their issuers.</p>
      </Container>
    </Section>
  );
}
