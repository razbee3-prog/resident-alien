import Link from "next/link";
import { HeroCards } from "@/components/card/hero-cards";
import { ChatCta } from "@/components/chat-cta";
import { Arrow, ButtonLink, Container, Eyebrow } from "@/components/ui";
import { disclosures } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-[-10%] h-[70%] w-[60%] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(135,133,255,.16), transparent 70%)" }}
      />
      <Container className="relative grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="animate-rise">
          <Eyebrow>Credit for people who just got here</Eyebrow>
          <h1 className="mt-5 text-[2.9rem] font-bold leading-[0.98] tracking-[-0.035em] sm:text-[3.6rem] md:text-[4.4rem]">
            You moved countries. Your credit didn’t.
          </h1>
          <p className="mt-7 max-w-[36rem] text-lg leading-relaxed text-muted md:text-xl">
            Resident Alien turns the evidence you already have, an offer letter or an I-20, payroll or sponsor funds, savings,
            into a starter credit line on day one. Then it coaches your file toward Amex Platinum or Chase Sapphire Reserve
            eligibility in 12–24 months, not the years most newcomers waste.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/waitlist">Join the waitlist</ButtonLink>
            <ChatCta />
            <ButtonLink href="/demo" variant="ghost">
              Run the readiness demo
            </ButtonLink>
          </div>
          <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-faint">{disclosures.short}</p>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-6">
            <Link href="/students" className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
              For international students <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/professionals" className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
              For newly arrived professionals <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <HeroCards />
        </div>
      </Container>
    </section>
  );
}
