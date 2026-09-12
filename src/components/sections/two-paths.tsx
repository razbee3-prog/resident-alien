import Link from "next/link";
import { Arrow, Container, Section } from "@/components/ui";
import { segments } from "@/lib/segments";

const points = {
  student: ["Your I-20 and funding count as evidence.", "A small line, autopay, low utilization.", "A real score before you graduate."],
  professional: ["Your offer letter counts as evidence.", "Reassessed the day payroll lands.", "On track for Platinum in 12–24 months."],
};

export function TwoPaths() {
  return (
    <Section>
      <Container>
        <h2 className="text-center text-[2.2rem] font-bold leading-[1] tracking-[-0.035em] md:text-[3.2rem]">Two cards. One file.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {[segments.student, segments.professional].map((s) => (
            <div key={s.key} className="panel flex flex-col p-8 md:p-10">
              <h3 className="text-[1.6rem] font-bold tracking-[-0.02em]">{s.plural}</h3>
              <p className="num mt-6 font-display text-[2.4rem] font-bold leading-none tracking-[-0.04em]">{s.limit}</p>
              <p className="mt-1 text-sm text-muted">to start, illustrative</p>
              <ul className="mt-7 flex flex-col gap-3 border-t border-hairline pt-6 text-[1rem] text-ink/90">
                {points[s.key].map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={s.href} className="group mt-8 inline-flex items-center gap-2 self-start font-medium text-ink">
                For {s.plural.toLowerCase()} <Arrow className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
