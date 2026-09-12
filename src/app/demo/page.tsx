import type { Metadata } from "next";
import { EngineUI } from "@/components/readiness/engine-ui";
import { Container, Eyebrow } from "@/components/ui";
import { disclosures } from "@/lib/site";

export const metadata: Metadata = {
  title: "Readiness engine demo",
  description: "An explainable financial readiness engine. Fictional inputs, real logic, plain-English reasons. Not a credit decision.",
};

export default function DemoPage() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Eyebrow>Readiness engine · demo</Eyebrow>
        <h1 className="mt-5 max-w-[18ch] text-[2.6rem] font-bold leading-[1] tracking-[-0.035em] sm:text-[3.4rem]">
          A lender sees no file and stops. This reads the evidence and shows a path.
        </h1>
        <p className="mt-6 max-w-[40rem] text-lg leading-relaxed text-muted">
          Change anything. The score, the path, the illustrative line, and the reasons update as you move. It doesn’t invent
          a credit score; it translates job, funding, savings, and obligations into a readiness call and the next unlock.
        </p>
        <div className="mt-12">
          <EngineUI />
        </div>
        <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint">{disclosures.demo}</p>
      </Container>
    </section>
  );
}
