import { ButtonLink, Container } from "@/components/ui";
import type { ReactNode } from "react";

export function ProductHero({ kicker, title, sub, visual }: { kicker: string; title: string; sub: string; visual: ReactNode }) {
  return (
    <section className="overflow-hidden border-b border-hairline">
      <Container className="grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="order-2 lg:order-1 lg:-ml-6">{visual}</div>
        <div className="order-1 lg:order-2">
          <p className="text-sm font-medium text-accent">{kicker}</p>
          <h1 className="mt-3 max-w-[12ch] text-[2.8rem] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[3.6rem] md:text-[4.2rem]">{title}</h1>
          <p className="mt-6 max-w-[27rem] text-lg leading-snug text-muted md:text-[1.2rem]">{sub}</p>
          <div className="mt-8">
            <ButtonLink href="/waitlist" size="lg">
              Join the waitlist
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Points({ title, items }: { title: string; items: { t: string; b: string }[] }) {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <h2 className="max-w-[12ch] text-[2.2rem] font-bold leading-[1] tracking-[-0.035em] md:text-[3rem]">{title}</h2>
        <dl className="divide-y divide-hairline border-y border-hairline">
          {items.map((it) => (
            <div key={it.t} className="grid gap-2 py-6 sm:grid-cols-[14rem_1fr] sm:gap-8">
              <dt className="text-[1.05rem] font-semibold text-ink">{it.t}</dt>
              <dd className="max-w-[36rem] text-[0.95rem] leading-relaxed text-muted">{it.b}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
