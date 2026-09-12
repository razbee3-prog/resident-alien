export const site = {
  name: "Resident Alien",
  url: "https://resident-alien.com",
  tagline: "You moved countries. Your credit didn’t.",
  description:
    "Resident Alien turns the evidence newcomers already have into a starter U.S. credit line on day one, then coaches the file toward premium-card eligibility. For international students and newly arrived professionals.",
  contactEmail: "hello@resident-alien.com",
  /** Sendblue line the "Chat with Credit Alien" button dials. Null hides the button. */
  chatNumber: process.env.NEXT_PUBLIC_SENDBLUE_NUMBER || null,
};

export const disclosures = {
  short:
    "Not a bank. Not affiliated with American Express or Chase. No approval is guaranteed.",
  long:
    "Resident Alien is a financial technology company, not a bank. Card and banking services will be provided by a partner bank, Member FDIC, to be announced. Resident Alien is not affiliated with, endorsed by, or sponsored by American Express or JPMorgan Chase. “Platinum,” “Sapphire Reserve,” and other card names are trademarks of their owners. Nothing on this site is a credit decision, an offer of credit, a credit score, or legal or immigration advice.",
  demo: "Demo only. Not a credit decision, an offer of credit, or a credit score.",
  safety:
    "Community reports are unverified. Nothing here is legal advice. Never approach, follow, or interfere with enforcement activity.",
};

export const nav = [
  { href: "/students", label: "Students" },
  { href: "/professionals", label: "Professionals" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/safety", label: "Safety" },
] as const;
