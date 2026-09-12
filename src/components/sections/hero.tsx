import { HeroCards } from "@/components/card/hero-cards";
import { ButtonLink, Container } from "@/components/ui";
import { disclosures } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] h-[720px] w-[900px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(135,133,255,.16), transparent 70%)" }}
      />
      <Container className="relative pb-6 pt-16 text-center md:pt-24">
        <h1 className="mx-auto max-w-[12ch] text-[3.4rem] font-bold leading-[0.95] tracking-[-0.045em] sm:text-[5rem] md:text-[6.5rem]">
          Land with credit.
        </h1>
        <p className="mx-auto mt-6 max-w-[30rem] text-lg leading-snug text-muted md:text-[1.35rem]">
          A U.S. credit line you can open before you arrive. Build from day one. Get to Platinum faster.
        </p>
        <div className="mt-9 flex justify-center">
          <ButtonLink href="/waitlist" size="lg">
            Join the waitlist
          </ButtonLink>
        </div>
        <p className="mt-5 text-xs text-faint">{disclosures.short}</p>
        <div className="mt-14">
          <HeroCards />
        </div>
      </Container>
    </section>
  );
}
