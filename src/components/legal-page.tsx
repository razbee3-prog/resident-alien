import { Container, Eyebrow } from "@/components/ui";

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: React.ReactNode }) {
  return (
    <section className="py-16 md:py-24">
      <Container className="max-w-[46rem]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-[2.4rem] font-bold leading-[1.02] tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-faint">Updated {updated}</p>
        <div className="mt-10 flex flex-col gap-6 text-[1rem] leading-relaxed text-muted [&_h2]:mt-4 [&_h2]:text-[1.25rem] [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </Container>
    </section>
  );
}
