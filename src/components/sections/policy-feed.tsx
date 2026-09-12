import Link from "next/link";
import { Arrow, Container, Section } from "@/components/ui";
import { policyFeed, type FeedTag } from "@/lib/policy-feed";

const tagTone: Record<FeedTag, string> = {
  "F-1": "border-accent/50 text-accent",
  "H-1B": "border-good/40 text-good",
  "All visas": "border-hairline-strong text-muted",
};

export function PolicyFeed({ limit, id = "changes", showAllLink = true }: { limit?: number; id?: string; showAllLink?: boolean }) {
  const items = limit ? policyFeed.slice(0, limit) : policyFeed;
  return (
    <Section id={id} className="scroll-mt-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[2.2rem] font-bold leading-[1] tracking-[-0.035em] md:text-[3.2rem]">What’s changing.</h2>
            <p className="mt-3 max-w-[34rem] text-lg text-muted">Policy moves that touch H-1B workers and F-1 students, one line each. Not legal advice.</p>
          </div>
          {showAllLink && limit ? (
            <Link href="/safety#changes" className="group inline-flex items-center gap-2 text-sm font-medium text-ink">
              All updates <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>
        <ol className="mt-10 divide-y divide-hairline border-y border-hairline">
          {items.map((it) => (
            <li key={it.title} className="grid gap-3 py-6 md:grid-cols-[9rem_1fr_auto] md:gap-8">
              <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-start">
                <span className="num text-sm text-muted">{it.label}</span>
                <span className="flex flex-wrap gap-1.5">
                  {it.tags.map((t) => (
                    <span key={t} className={`rounded-full border px-2 py-0.5 text-[0.66rem] font-medium ${tagTone[t]}`}>
                      {t}
                    </span>
                  ))}
                </span>
              </div>
              <div>
                <p className="text-[1.1rem] font-semibold leading-snug text-ink">{it.title}</p>
                <p className="mt-1.5 max-w-[46rem] text-[0.95rem] leading-relaxed text-muted">{it.body}</p>
              </div>
              <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                {it.status ? <span className="text-xs text-faint">{it.status}</span> : null}
                <a href={it.source.url} target="_blank" rel="noreferrer" className="text-xs text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink">
                  {it.source.name}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
