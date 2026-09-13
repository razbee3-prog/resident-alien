import Link from "next/link";
import { CoachMock, EvidenceMock, TransferMock } from "@/components/mocks";
import { Arrow, Container } from "@/components/ui";

const rows = [
  {
    kicker: "The card",
    title: "Approved without a credit history.",
    body: "We read what you actually have: an offer letter, an I-20, payroll, funding, savings. A decision in days, a Visa card you can use for rent, a phone, a flight. Every payment reports to the bureaus.",
    href: "/professionals",
    link: "See the cards",
    mock: <EvidenceMock />,
  },
  {
    kicker: "Alien Intelligence",
    title: "Build credit with a coach that never sleeps.",
    body: "It tells you what to charge, when to pay, and where to cap utilization. It warns you before a missed payment or a bad application hurts the file, and tells you the month you’re ready for the next card.",
    href: "/ai",
    link: "How the coach works",
    mock: <CoachMock />,
  },
  {
    kicker: "Send home",
    title: "Send money home. Set it and forget it.",
    body: "Schedule a transfer to family from your Resident Alien account: one amount, one date, the fee shown before you confirm. The coach tells you what’s safe to send after rent.",
    href: "/transfers",
    link: "About transfers",
    mock: <TransferMock />,
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-28">
      <Container className="flex flex-col gap-24 md:gap-32">
        {rows.map((r, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={r.kicker} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
              <div className={`lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : "lg:col-start-1"}`}>
                <p className="text-sm font-medium text-accent">{r.kicker}</p>
                <h2 className="mt-3 max-w-[14ch] text-[2rem] font-bold leading-[1.02] tracking-[-0.03em] md:text-[2.75rem]">{r.title}</h2>
                <p className="mt-5 max-w-[30rem] text-[1.05rem] leading-relaxed text-muted">{r.body}</p>
                <Link href={r.href} className="group mt-6 inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink">
                  {r.link} <Arrow className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className={`lg:col-span-6 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"}`}>
                <div className={`mx-auto w-full max-w-[440px] ${flip ? "lg:mr-auto lg:ml-0" : "lg:ml-auto lg:mr-0"} ${i === 1 ? "lg:max-w-[480px]" : ""}`}>{r.mock}</div>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
