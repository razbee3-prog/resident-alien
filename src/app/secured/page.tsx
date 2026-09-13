import type { Metadata } from "next";
import { SingleCard } from "@/components/card/single-card";
import { ProductHero, Points } from "@/components/product-hero";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";

export const metadata: Metadata = {
  title: "Secured card",
  description: "A deposit-backed Visa card with the same coach and the same reporting. It graduates on its own after on-time payments.",
};

export default function SecuredPage() {
  return (
    <>
      <ProductHero
        kicker="Secured card"
        title="A deposit-backed start that graduates on its own."
        sub="If we can’t approve you on your evidence yet, you start here. Same Visa card, same coach, same reporting. Your deposit comes back."
        visual={<SingleCard segment="student" country="NG" />}
      />
      <Points
        title="How it works."
        items={[
          { t: "The deposit", b: "$200 to $500, refundable, held by our partner bank. It sets your line and it never leaves your name." },
          { t: "The same file", b: "Every payment reports to the bureaus exactly like the unsecured cards. A bureau can’t tell the difference." },
          { t: "Graduation", b: "After a run of on-time payments and new evidence, a paycheck or a funding letter, the coach moves you to an unsecured line and returns the deposit." },
          { t: "What it isn’t", b: "Not a prepaid card, not a debit card. Spending is on credit, and it builds credit." },
        ]}
      />
      <Faq
        title="Questions about secured."
        items={[
          { q: "Why would I start secured?", a: "Usually because payroll hasn’t landed or funding isn’t visible in a U.S. account yet. The coach tells you exactly what unlocks the upgrade." },
          { q: "Does a secured card build credit slower?", a: "No. The bureaus see the same on-time history. What matters is paying in full and keeping utilization low." },
          { q: "When do I get the deposit back?", a: "When you graduate to an unsecured line, or when you close the account in good standing." },
        ]}
      />
      <Cta />
    </>
  );
}
