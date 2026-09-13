import Link from "next/link";
import { HeroCard } from "@/components/card/hero-card";
import { ChatCta } from "@/components/chat-cta";
import { Arrow, ButtonLink, Container } from "@/components/ui";

export function Hero() {
  return (
    <section className="overflow-hidden border-b border-hairline">
      <Container className="grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="order-2 lg:order-1 lg:-ml-6">
          <HeroCard />
        </div>
        <div className="order-1 lg:order-2">
          <h1 className="max-w-[10ch] text-[3.2rem] font-bold leading-[0.95] tracking-[-0.04em] sm:text-[4.2rem] md:text-[5rem]">Land with credit.</h1>
          <p className="mt-6 max-w-[27rem] text-lg leading-snug text-muted md:text-[1.3rem]">
            A Visa credit card for people who just got here. No U.S. credit history needed. Approved on the evidence you
            already have.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="#waitlist" size="lg">
              Join the waitlist
            </ButtonLink>
            <ChatCta size="lg" />
            <Link href="#cards" className="group inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink">
              Compare the cards <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <dl className="mt-12 grid max-w-[30rem] grid-cols-3 divide-x divide-hairline border-t border-hairline pt-5">
            {[
              ["No history", "No U.S. credit file needed"],
              ["Days", "not months, to a decision"],
              ["3 bureaus", "every payment reported"],
            ].map(([k, v], i) => (
              <div key={k} className={i === 0 ? "pr-4" : "px-4"}>
                <dt className="font-display text-[1.25rem] font-bold tracking-[-0.02em]">{k}</dt>
                <dd className="mt-1 text-[0.8rem] leading-snug text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
