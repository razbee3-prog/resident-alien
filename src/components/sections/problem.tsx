import { Container, Heading, Section } from "@/components/ui";

const tiles = [
  {
    label: "The file",
    title: "A six-figure offer looks like nothing to a bureau.",
    body: "Salary, savings, and a decade of repayment history at home don’t exist in a U.S. file. To a lender, you arrive blank.",
  },
  {
    label: "The bills",
    title: "The biggest costs land before the first paycheck.",
    body: "Deposit, rent, a phone, a laptop, flights. All of it before you hold a U.S. card, most of it before a U.S. bank knows your name.",
  },
  {
    label: "The wrong card",
    title: "The first card you pick can cost you the premium one.",
    body: "Random applications mean inquiries, a stalled score, and a Chase 5/24 count you didn’t know you were running.",
  },
];

export function Problem() {
  return (
    <Section id="problem">
      <Container>
        <Heading eyebrow="The problem" title="Invisible on day one." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiles.map((t) => (
            <article key={t.label} className="panel flex flex-col gap-4 p-7">
              <p className="eyebrow">{t.label}</p>
              <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.015em]">{t.title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted">{t.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
