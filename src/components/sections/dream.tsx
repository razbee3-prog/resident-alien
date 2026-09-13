import { Container } from "@/components/ui";

const steps = [
  { when: "Today", what: "Resident Alien card", detail: "Approved on your evidence. Reporting from the first statement." },
  { when: "Month 6", what: "Your first score", detail: "Six months of on-time payments is what a FICO score needs to exist." },
  { when: "Month 12–24", what: "720–740 and ready", detail: "The file that Amex Platinum, Chase Sapphire Reserve, and a mortgage lender actually approve." },
];

export function Dream() {
  return (
    <section className="border-t border-hairline bg-[#0d0d11] py-20 md:py-28">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="max-w-[12ch] text-[2.4rem] font-bold leading-[0.98] tracking-[-0.035em] md:text-[3.6rem]">Not your forever card. Your fastest way to it.</h2>
          <p className="mt-6 max-w-[28rem] text-[1.05rem] leading-relaxed text-muted">
            Whatever needs a 720 or 740, a premium card, an apartment without a co-signer, a mortgage, starts with a
            file. We build the file and tell you when you’re ready. Then you leave. That’s the point.
          </p>
        </div>
        <ol className="flex flex-col">
          {steps.map((s, i) => (
            <li key={s.what} className={`grid gap-4 py-7 sm:grid-cols-[7rem_1fr] ${i ? "border-t border-hairline" : ""}`}>
              <span className="num font-display text-[1.1rem] font-semibold text-accent">{s.when}</span>
              <div>
                <p className="text-[1.35rem] font-semibold tracking-[-0.02em]">{s.what}</p>
                <p className="mt-1.5 max-w-[28rem] text-[0.95rem] leading-relaxed text-muted">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-faint lg:col-span-2">
          Timelines are typical, not promised. Card names are trademarks of their issuers; Resident Alien is not affiliated with them and no approval is guaranteed.
        </p>
      </Container>
    </section>
  );
}
