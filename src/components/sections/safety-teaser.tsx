import Link from "next/link";
import { Arrow, Container } from "@/components/ui";

export function SafetyTeaser() {
  return (
    <section className="border-t border-hairline py-16">
      <Container>
        <div className="panel grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <h2 className="text-[1.6rem] font-bold tracking-[-0.025em] md:text-[2rem]">Know what’s happening around you.</h2>
            <p className="mt-2 max-w-[36rem] text-[1rem] text-muted">Community-reported enforcement activity on a live map, your rights, and the hotlines that answer.</p>
          </div>
          <Link href="/safety" className="btn btn-ghost group">
            Open the safety center <Arrow className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
