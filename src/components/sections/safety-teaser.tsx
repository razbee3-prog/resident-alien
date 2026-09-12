import Link from "next/link";
import { Arrow, Container } from "@/components/ui";

export function SafetyTeaser() {
  return (
    <section className="border-t border-hairline py-14">
      <Container>
        <div className="panel grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-9">
          <div>
            <p className="eyebrow">Safety center</p>
            <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.02em]">Know what’s happening around you.</h3>
            <p className="mt-2 max-w-[40rem] text-[0.95rem] leading-relaxed text-muted">
              Community-reported enforcement activity on a live map, your rights in plain language, and the hotlines that
              answer. Separate from your money, by design.
            </p>
          </div>
          <Link href="/safety" className="btn btn-ghost group">
            Open the safety center <Arrow className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
