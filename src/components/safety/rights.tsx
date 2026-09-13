import { Container, Section } from "@/components/ui";

const rights = [
  {
    t: "You can stay silent.",
    b: "You don’t have to answer questions about where you were born, your status, or how you entered. Say it out loud: “I choose to remain silent.” Then stop talking.",
  },
  {
    t: "You don’t have to open your door.",
    b: "Agents need a warrant signed by a judge, with your name or address on it, to enter your home. Ask them to slide it under the door. An ICE administrative form is not a judicial warrant.",
  },
  {
    t: "Don’t sign anything you don’t understand.",
    b: "Some forms give up your right to a hearing. Ask for a lawyer and for the document in your language.",
  },
  {
    t: "You can refuse a search.",
    b: "Say “I do not consent to a search.” Never physically resist, run, or lie. Refusing calmly is your right; resisting is a separate charge.",
  },
  {
    t: "Carry your valid documents. Never fake ones.",
    b: "Adults with nonimmigrant status are expected to carry proof of it. Keep your passport, visa, I-94, EAD, or I-20 on you or in your phone, and copies with someone you trust.",
  },
  {
    t: "You can record in public.",
    b: "Filming enforcement in a public place is generally protected. Keep distance, don’t obstruct, and say clearly that you are recording if asked.",
  },
  {
    t: "If detained, ask for a lawyer and your consulate.",
    b: "Give your name. Don’t discuss your case with anyone but your attorney. You have the right to contact your consulate, and to make a phone call.",
  },
  {
    t: "Have a plan before you need one.",
    b: "Memorize two phone numbers. Write down your A-number if you have one. Decide who picks up kids, who has keys, who calls the lawyer. Students: your DSO. Workers: your employer’s immigration counsel.",
  },
];

const hotlines = [
  { name: "United We Dream MigraWatch", detail: "Report ICE or CBP activity and get support, nationwide.", phone: "1-844-363-1423", text: "Text 877877", href: "https://unitedwedream.org/our-work/deportation-defense/migrawatch-hotline/" },
  { name: "ACLU · Know your rights, immigrants", detail: "Plain-language guides in many languages.", href: "https://www.aclu.org/know-your-rights/immigrants-rights" },
  { name: "ILRC red cards", detail: "Printable cards that state your rights, to hand to an officer.", href: "https://www.ilrc.org/red-cards-tarjetas-rojas" },
  { name: "National Immigration Law Center", detail: "Legal resources and policy updates.", href: "https://www.nilc.org/" },
];

export function Rights() {
  return (
    <>
      <Section id="rights">
        <Container>
          <div className="max-w-[44rem]">
            <p className="text-sm font-medium text-accent">Know your rights</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] md:text-[2.75rem]">Eight things to know before it matters.</h2>
            <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-muted">
              These apply to everyone in the United States, whatever your status. They are general information, not legal
              advice, and the details vary by state.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2">
            {rights.map((r, i) => (
              <li key={r.t} className="panel flex gap-5 p-6">
                <span className="num font-mono text-[0.72rem] tracking-[0.14em] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium text-ink">{r.t}</p>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{r.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="hotlines">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-accent">Hotlines and guides</p>
            <h2 className="mt-3 text-[2rem] font-bold leading-[1.05] tracking-[-0.025em]">The numbers that answer.</h2>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
              Save the first one in your phone now. These organizations are not affiliated with Resident Alien; we list them
              because they do this work well.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-[1.25rem] border border-hairline bg-hairline">
            {hotlines.map((h) => (
              <li key={h.name} className="grid gap-2 bg-surface p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <a href={h.href} target="_blank" rel="noreferrer" className="font-medium text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink">
                    {h.name}
                  </a>
                  <p className="mt-1 text-sm text-muted">{h.detail}</p>
                </div>
                {h.phone ? (
                  <div className="text-left sm:text-right">
                    <a href={`tel:${h.phone.replace(/[^\d+]/g, "")}`} className="num font-display text-xl font-bold tracking-[-0.02em] text-ink">
                      {h.phone}
                    </a>
                    {h.text ? <p className="text-xs text-muted">{h.text}</p> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="privacy">
        <Container>
          <div className="panel grid gap-6 p-7 md:grid-cols-4 md:p-9">
            {[
              { t: "No accounts", b: "Nothing to sign up for, nothing to log in to, nothing that ties a report to you." },
              { t: "Rounded location", b: "Reports store a position rounded to about a city block. We never keep precise coordinates." },
              { t: "Hashed, rotated, gone", b: "A one-way hash of your connection, re-salted daily, exists only to stop spam. It can’t be reversed." },
              { t: "Four-hour memory", b: "Every report deletes itself after four hours. There is no archive to subpoena." },
            ].map((x) => (
              <div key={x.t}>
                <p className="eyebrow">{x.t}</p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/90">{x.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
