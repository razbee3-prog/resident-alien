import { Container } from "@/components/ui";

export function Statement() {
  return (
    <section className="border-t border-hairline py-20 md:py-24">
      <Container className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-16">
        <p className="num font-display text-[4.5rem] font-bold leading-none tracking-[-0.05em] md:text-[7.5rem]">365,000</p>
        <div className="max-w-[26rem]">
          <p className="text-xl leading-snug text-ink md:text-2xl">people move to the U.S. every year with a job or a university place, and no credit history.</p>
          <p className="mt-2 text-xl text-muted md:text-2xl">You don’t have to start from zero.</p>
        </div>
      </Container>
    </section>
  );
}
