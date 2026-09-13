export const site = {
  name: "Resident Alien",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://resident-alien.com",
  tagline: "Land with credit.",
  description:
    "A U.S. credit line you can open before you arrive. Build from day one and get to Platinum faster. For international students and newly arrived professionals.",
  contactEmail: "hello@resident-alien.com",
};

export const disclosures = {
  short: "Not a bank. Not affiliated with American Express or Chase. No approval is guaranteed.",
  long:
    "Resident Alien is a financial technology company, not a bank. Card and banking services will be provided by a partner bank, Member FDIC, to be announced. Resident Alien is not affiliated with, endorsed by, or sponsored by American Express or JPMorgan Chase. “Platinum,” “Sapphire Reserve,” and other card names are trademarks of their owners. Nothing on this site is a credit decision, an offer of credit, a credit score, or legal or immigration advice.",
  safety:
    "Community reports are unverified. Nothing here is legal advice. Never approach, follow, or interfere with enforcement activity.",
};

export const nav = [
  { href: "/students", label: "Students" },
  { href: "/professionals", label: "Professionals" },
  { href: "/safety", label: "Safety" },
  { href: "/news", label: "News" },
] as const;
