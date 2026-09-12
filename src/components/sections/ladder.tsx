import { Container, Heading, Section } from "@/components/ui";

export type Rung = { month: string; step: string; unit?: string };

export const defaultRungs: Rung[] = [
  { month: "0", step: "Resident Alien starter line. Reports to the bureaus from the first statement." },
  { month: "~6", step: "First FICO score appears." },
  { month: "9–12", step: "Mainstream 1.5–2% cash-back card, the card most Americans actually carry." },
  { month: "12–18", step: "Mid-tier travel card, Sapphire Preferred class." },
  { month: "12–24", step: "Platinum or Reserve consideration: 720–740+ and a clean 12–24 month file." },
];

export function Ladder({
  rungs = defaultRungs,
  eyebrow = "The path",
  title = "The straight line to Platinum and Reserve.",
  lede = "Most newcomers zigzag: a secured card, a store card, two rejections, a stalled score. We map the shortest clean path and tell you the week you’re ready.",
  unit = "Month",
}: {
  rungs?: Rung[];
  eyebrow?: string;
  title?: string;
  lede?: string;
  unit?: string;
}) {
  return (
    <Section id="path">
      <Container>
        <Heading eyebrow={eyebrow} title={title} lede={lede} />
        <ol className="ladder mt-14 grid gap-8 md:gap-5" style={{ "--rungs": rungs.length } as React.CSSProperties}>
          {rungs.map((r, i) => {
            const last = i === rungs.length - 1;
            return (
              <li key={r.month + i} className="relative pl-6 md:pl-0 md:pt-7">
                <span
                  aria-hidden="true"
                  className="absolute left-[3px] top-2 h-[calc(100%+1rem)] w-px bg-hairline-strong md:left-0 md:top-[10px] md:h-px md:w-[calc(100%+1.25rem)]"
                  style={last ? { display: "none" } : undefined}
                />
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-[6px] h-2 w-2 rounded-full border-2 border-accent md:top-[6px] ${last ? "bg-accent" : "bg-ground"}`}
                />
                {(r.unit ?? unit) ? <p className="eyebrow">{r.unit ?? unit}</p> : <p className="eyebrow">&nbsp;</p>}
                <p className="num mt-1 font-display text-[1.75rem] font-bold leading-none tracking-[-0.03em]">{r.month}</p>
                <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">{r.step}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-12 max-w-[60rem] text-xs leading-relaxed text-faint">
          “Faster” means fewer wasted months, not skipping on-time payments. Timelines are typical, not promised. Card names are
          trademarks of their issuers. Resident Alien is not affiliated with American Express or JPMorgan Chase, and no
          approval is guaranteed.
        </p>
      </Container>
    </Section>
  );
}
