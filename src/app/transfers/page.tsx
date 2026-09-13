import type { Metadata } from "next";
import { TransferMock } from "@/components/mocks";
import { ProductHero, Points } from "@/components/product-hero";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";

export const metadata: Metadata = {
  title: "Send home",
  description: "Set-and-forget transfers to family from your Resident Alien account, with the fee shown before you confirm.",
};

export default function TransfersPage() {
  return (
    <>
      <ProductHero
        kicker="Send home"
        title="Send money home. Set it and forget it."
        sub="One amount, one date, the fee shown before you confirm. Funded from your Resident Alien account, so it fits around rent instead of fighting it."
        visual={
          <div className="mx-auto w-full max-w-[520px] lg:mx-0">
            <TransferMock />
          </div>
        }
      />
      <Points
        title="How it works."
        items={[
          { t: "Scheduled", b: "Pick the amount and the day. It goes every month until you change it. Skip a month in one tap." },
          { t: "Priced up front", b: "The fee and the amount they receive are on the screen before you confirm. No spread hidden in the rate." },
          { t: "Safe to send", b: "The coach knows your rent date and your balance. It tells you what you can send this month without touching the money the card needs." },
          { t: "Funded from your account", b: "Transfers come out of your U.S. balance, not cash, which generally keeps them clear of the 2026 excise tax on cash-funded remittances." },
        ]}
      />
      <Faq
        title="Questions about transfers."
        items={[
          { q: "Which countries?", a: "We open transfers by corridor as we open the card by country. Mexico, India, the Philippines, and Nigeria first." },
          { q: "Does sending money hurt my credit?", a: "No. Transfers come from your balance, not the card. The coach only flags it if a transfer would leave you short for a statement." },
          { q: "Who moves the money?", a: "A licensed transfer partner, to be announced with the bank partner. Resident Alien is not a money transmitter until we say so here." },
        ]}
      />
      <Cta />
    </>
  );
}
