import Link from "next/link";
import { Arrow, Container } from "@/components/ui";

const cols = [
  { key: "student", name: "Student", href: "/students" },
  { key: "professional", name: "Professional", href: "/professionals" },
  { key: "secured", name: "Secured", href: "/secured" },
];

const rows: { label: string; values: [string, string, string] }[] = [
  { label: "Who it’s for", values: ["F-1 students", "H-1B and new hires", "Anyone we can’t approve yet"] },
  { label: "Approved on", values: ["I-20, funding, savings", "Offer letter, payroll, savings", "A refundable deposit"] },
  { label: "Starting line, illustrative", values: ["$500–$1,500", "$1,000–$2,500", "Your deposit, $200–$500"] },
  { label: "Reports to bureaus", values: ["Yes", "Yes", "Yes"] },
  { label: "Alien Intelligence", values: ["Included", "Included", "Included"] },
  { label: "Graduates", values: ["Larger line each term", "Reassessed at first payroll", "Deposit back after on-time payments"] },
];

export function CardsTable() {
  return (
    <section id="cards" className="scroll-mt-16 border-t border-hairline py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[16ch] text-[2.4rem] font-bold leading-[0.98] tracking-[-0.035em] md:text-[3.2rem]">One file. Three ways in.</h2>
          <p className="max-w-[26rem] text-[1rem] text-muted">Same Visa card, same coach, same reporting. The evidence you have decides which one you start on.</p>
        </div>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[0.95rem]">
            <thead>
              <tr>
                <th className="w-[22%] pb-4 text-left text-xs font-medium text-muted" scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                {cols.map((c) => (
                  <th key={c.key} className="pb-4 text-left text-[1.35rem] font-bold tracking-[-0.02em]" scope="col">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-hairline">
                  <th scope="row" className="py-4 pr-6 text-left text-sm font-normal text-muted">
                    {r.label}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={i} className="py-4 pr-6 text-ink/90">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-hairline">
                <td />
                {cols.map((c) => (
                  <td key={c.key} className="py-5 pr-6">
                    <Link href={c.href} className="group inline-flex items-center gap-2 font-medium text-ink">
                      {c.name} card <Arrow className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
