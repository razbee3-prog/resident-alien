import Link from "next/link";
import { Container, Logo } from "@/components/ui";
import { disclosures, site } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/students", label: "For students" },
      { href: "/professionals", label: "For professionals" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/demo", label: "Readiness demo" },
      { href: "/waitlist", label: "Join the waitlist" },
    ],
  },
  {
    title: "Safety",
    links: [
      { href: "/safety", label: "Safety center" },
      { href: "/safety#rights", label: "Know your rights" },
      { href: "/safety#hotlines", label: "Hotlines" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: `mailto:${site.contactEmail}`, label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/disclosures", label: "Disclosures" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="text-ink" />
              <span className="font-mono text-[0.78rem] uppercase tracking-[0.2em]">Resident Alien</span>
            </div>
            <p className="mt-5 max-w-[22rem] text-sm leading-relaxed text-muted">
              Credit for people who just got here. Built for international students and newly arrived professionals.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-muted text-sm">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 border-t border-hairline pt-8">
          <p className="max-w-[72rem] text-[0.8rem] leading-relaxed text-faint">{disclosures.long}</p>
          <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-faint">
            © {new Date().getFullYear()} Resident Alien · resident-alien.com
          </p>
        </div>
      </Container>
    </footer>
  );
}
