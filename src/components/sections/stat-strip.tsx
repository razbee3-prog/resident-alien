import { Container } from "@/components/ui";

export function StatStrip() {
  return (
    <section className="border-y border-hairline bg-surface/40">
      <Container className="grid items-center gap-6 py-10 md:grid-cols-[auto_1fr] md:gap-12">
        <p className="num font-display text-[3.2rem] font-bold leading-none tracking-[-0.04em] md:text-[4.2rem]">~350,000</p>
        <div>
          <p className="max-w-[40rem] text-lg leading-snug text-ink md:text-xl">
            international students and newly arrived professionals start a U.S. financial life every year with no credit
            file.
          </p>
          <p className="mt-2 text-xs text-faint">
            New international student enrollments, 2024/25, plus H-1B initial approvals processed abroad. Raw visa issuances are
            not added.
          </p>
        </div>
      </Container>
    </section>
  );
}
