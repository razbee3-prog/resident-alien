import { Container } from "@/components/ui";

export type FaqItem = { q: string; a: string };

export const defaultFaq: FaqItem[] = [
  {
    q: "Do I need a Social Security number?",
    a: "Professionals get one through their employer and most students get one with on-campus work. If our card partner allows a passport or ITIN start, we’ll say so plainly. We won’t claim it until it’s true.",
  },
  {
    q: "Is it a real Visa credit card?",
    a: "Yes. It’s a revolving line on the Visa network, issued by our partner bank, that reports to the bureaus. Not a prepaid card, not a debit card with a credit label.",
  },
  {
    q: "What if you can’t approve me on my evidence?",
    a: "You start on the Secured card with a refundable deposit, with the same coach and the same reporting. It graduates on its own after on-time payments.",
  },
  {
    q: "Are you Amex or Chase?",
    a: "No. We’re the step before them. We’re not affiliated with either, and nobody can guarantee an approval.",
  },
];

export function Faq({ items = defaultFaq, title = "Questions people ask first." }: { items?: FaqItem[]; title?: string }) {
  return (
    <section id="faq" className="border-t border-hairline py-20 md:py-28">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <h2 className="max-w-[12ch] text-[2.2rem] font-bold leading-[1] tracking-[-0.035em] md:text-[3rem]">{title}</h2>
        <div className="divide-y divide-hairline border-y border-hairline">
          {items.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.05rem] font-medium leading-snug text-ink [&::-webkit-details-marker]:hidden">
                {it.q}
                <span aria-hidden="true" className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-hairline-strong text-muted transition-transform group-open:rotate-45">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-[40rem] text-[0.95rem] leading-relaxed text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
