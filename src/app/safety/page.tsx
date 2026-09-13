import type { Metadata } from "next";
import { Rights } from "@/components/safety/rights";
import { PolicyFeed } from "@/components/sections/policy-feed";
import { SafetyApp } from "@/components/safety/safety-app";
import { Container, Eyebrow } from "@/components/ui";
import { disclosures } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety center",
  description: "Community-reported immigration enforcement activity on a live map, your rights in plain language, and the hotlines that answer.",
};

export default function SafetyPage() {
  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[44rem]">
              <Eyebrow>Safety center</Eyebrow>
              <h1 className="mt-4 text-[2.6rem] font-bold leading-[1] tracking-[-0.035em] sm:text-[3.4rem]">Know what’s happening around you.</h1>
              <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-muted">
                Reported enforcement hotspots and community reports on one map, the policy changes that touch your status, and your
                rights one scroll away. Kept separate from your money, by design.
              </p>
            </div>
          </div>
          <p className="mt-8 rounded-xl border border-warn/30 bg-warn/[.06] px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-warn">
            {disclosures.safety}
          </p>
          <div className="mt-8">
            <SafetyApp />
          </div>
        </Container>
      </section>
      <PolicyFeed showAllLink={false} />
      <Rights />
    </>
  );
}
