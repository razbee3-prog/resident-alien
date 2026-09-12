import type { Metadata } from "next";
import { Cta } from "@/components/sections/cta";
import { Container, Eyebrow, Section } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Why Resident Alien exists, why the name, and what is real today.",
};

export default function AboutPage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <Container className="max-w-[52rem]">
          <Eyebrow>About</Eyebrow>
          <h1 className="mt-5 text-[2.6rem] font-bold leading-[1] tracking-[-0.035em] sm:text-[3.4rem]">
            Moving countries should change your address, not erase your financial identity.
          </h1>
          <div className="mt-10 flex flex-col gap-6 text-lg leading-relaxed text-muted">
            <p>
              Every year, roughly 350,000 people begin a U.S. financial life with a job or a place at a university and no
              credit file at all. Migration destroys financial data portability long before it says anything about
              creditworthiness. A six-figure offer letter and a decade of paid-off loans at home are invisible to a U.S.
              bureau on day one.
            </p>
            <p>
              Resident Alien reads the evidence you actually have, opens a starter line sized to it, and coaches the file
              toward the cards people actually want. We don’t hand you Platinum. We make you the borrower Platinum and
              Reserve approve.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container className="grid gap-10 md:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Why the name</p>
            <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.02em]">It’s what the IRS calls you.</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
              “Resident alien” is a tax status you get handed on arrival. We think you deserve a better card than a tax
              status, and a name that says out loud what the system already calls you. If it ever stops being funny, we’ll
              change it.
            </p>
          </div>
          <div>
            <p className="eyebrow">What’s real today</p>
            <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.02em]">A waitlist, a working engine, a safety map.</h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
              The card is not issued yet. The readiness engine on this site runs real logic on fictional inputs. The safety
              center runs on community reports. When a bank partner is signed, the disclosures on this site change before
              anything else does.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <p className="eyebrow">Principles</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { t: "Evidence over inference", b: "We read documents and cash flow. We don’t guess from your passport." },
              { t: "Explain every decision", b: "Every path comes with reasons a person can argue with." },
              { t: "Transparent, not fear-based", b: "Privacy and safety in plain language. No scare copy, no legal advice." },
              { t: "No premium theater", b: "We never promise Platinum or Reserve. We build the file they underwrite." },
              { t: "The AI coaches, humans decide", b: "No model approves credit, sets policy, or writes adverse-action reasons on its own." },
              { t: "Your data isn’t a product", b: "We don’t sell it, and we publish what we’d be compelled to share." },
            ].map((x) => (
              <li key={x.t} className="panel p-6">
                <p className="font-medium text-ink">{x.t}</p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{x.b}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-muted">
            Talk to us:{" "}
            <a href={`mailto:${site.contactEmail}`} className="text-ink underline decoration-hairline-strong underline-offset-4">
              {site.contactEmail}
            </a>
          </p>
        </Container>
      </Section>
      <Cta />
    </>
  );
}
