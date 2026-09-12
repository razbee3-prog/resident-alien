import { Container } from "@/components/ui";

export function Statement() {
  return (
    <section className="border-t border-hairline py-24 text-center md:py-32">
      <Container>
        <p className="num font-display text-[4rem] font-bold leading-none tracking-[-0.05em] sm:text-[6rem] md:text-[8rem]">365,000</p>
        <p className="mx-auto mt-5 max-w-[26rem] text-xl leading-snug text-ink md:text-2xl">people start their U.S. financial life from zero every year.</p>
        <p className="mt-3 text-xl text-muted md:text-2xl">You don’t have to.</p>
      </Container>
    </section>
  );
}
