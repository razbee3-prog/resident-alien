import type { Metadata } from "next";
import { CoachMock } from "@/components/mocks";
import { ProductHero, Points } from "@/components/product-hero";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";

export const metadata: Metadata = {
  title: "Alien Intelligence",
  description: "AI-assisted credit building. A coach that tells you what to charge, when to pay, and when you’re ready for the next card.",
};

export default function AiPage() {
  return (
    <>
      <ProductHero
        kicker="Alien Intelligence"
        title="Credit building, with a coach that never sleeps."
        sub="It plans your spend, watches your file, and tells you the month you’re ready for the next card. You just pay on time."
        visual={
          <div className="mx-auto w-full max-w-[520px] lg:mx-0">
            <CoachMock />
          </div>
        }
      />
      <Points
        title="What it does."
        items={[
          { t: "A weekly plan", b: "What to charge, when to pay, where to cap utilization. We say 10%, not 30%, because 10% is what a fast-rising file looks like." },
          { t: "Alerts before damage", b: "A missed autopay, utilization creeping up, an application you shouldn’t submit, your Chase 5/24 count. You hear about it before the bureau does." },
          { t: "Reporting check", b: "We confirm the bureaus received the right file under the right identifiers, which is where files for people new to the U.S. most often go wrong." },
          { t: "The readiness call", b: "The month you look ready for a mainstream card, a mid-tier travel card, and a premium card. Not a guess, a date, revised as you go." },
          { t: "What it never does", b: "Approve credit on its own, set policy, or write the legally required reasons for a decline. People decide; the coach explains." },
        ]}
      />
      <Faq
        title="Questions about the coach."
        items={[
          { q: "Is this a chatbot?", a: "No. It’s a plan and a set of alerts tied to your real statements. You can ask it questions, but it works even if you never do." },
          { q: "Does it see my bank account?", a: "It sees the Resident Alien account and the card. Connecting an outside account is optional and improves the plan." },
          { q: "Will it apply for cards for me?", a: "Never. It tells you when you’re ready and which card fits. You apply." },
        ]}
      />
      <Cta />
    </>
  );
}
