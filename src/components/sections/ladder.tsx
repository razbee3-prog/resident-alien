import { Container, Section } from "@/components/ui";

export type Rung = { month: string; step: string; unit?: string };

export function Ladder({ rungs, title = "Month by month.", lede = "" }: { rungs: Rung[]; title?: string; lede?: string }) {
  return (
    <Section id="path">
      <Container>
        <h2 className="text-[2.2rem] font-bold leading-[1] tracking-[-0.035em] md:text-[3.2rem]">{title}</h2>
        {lede ? <p className="mt-4 max-w-[36rem] text-lg text-muted">{lede}</p> : null}
        <ol className="ladder mt-12 grid gap-8 md:gap-5" style={{ "--rungs": rungs.length } as React.CSSProperties}>
          {rungs.map((r, i) => {
            const last = i === rungs.length - 1;
            return (
              <li key={r.month + i} className="relative pl-6 md:pl-0 md:pt-7">
                <span
                  aria-hidden="true"
                  className="absolute left-[3px] top-2 h-[calc(100%+1rem)] w-px bg-hairline-strong md:left-0 md:top-[10px] md:h-px md:w-[calc(100%+1.25rem)]"
                  style={last ? { display: "none" } : undefined}
                />
                <span aria-hidden="true" className={`absolute left-0 top-[6px] h-2 w-2 rounded-full border-2 border-accent ${last ? "bg-accent" : "bg-ground"}`} />
                <p className="text-xs text-muted">{r.unit || " "}</p>
                <p className="num mt-1 font-display text-[1.75rem] font-bold leading-none tracking-[-0.03em]">{r.month}</p>
                <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">{r.step}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-10 text-xs text-faint">Typical, not promised. Every step depends on on-time payments.</p>
      </Container>
    </Section>
  );
}
