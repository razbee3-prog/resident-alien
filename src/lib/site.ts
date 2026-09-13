export const site = {
  name: "Resident Alien",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://resident-alien.com",
  tagline: "Land with credit.",
  description:
    "A Visa credit card for people who just got here. No U.S. credit history needed. Build credit with an AI coach, send money home, and get to your dream card faster.",
  contactEmail: "hello@resident-alien.com",
};

export const disclosures = {
  short: "Not a bank. Not affiliated with American Express or Chase. No approval is guaranteed.",
  long:
    "Resident Alien is a financial technology company, not a bank. Card and banking services will be provided by a partner bank, Member FDIC, to be announced. Cards are expected to be issued on the Visa network; Visa is a trademark of Visa International. Resident Alien is not affiliated with, endorsed by, or sponsored by American Express or JPMorgan Chase. “Platinum,” “Sapphire Reserve,” and other card names are trademarks of their owners. Nothing on this site is a credit decision, an offer of credit, a credit score, or legal or immigration advice.",
  safety:
    "Community reports are unverified. Nothing here is legal advice. Never approach, follow, or interfere with enforcement activity.",
};

export type MenuItem = { href: string; label: string; desc: string };
export type MenuGroup = { title: string; items: MenuItem[] };

export const productMenu: MenuGroup[] = [
  {
    title: "Credit cards",
    items: [
      { href: "/students", label: "Student card", desc: "Approved on your I-20 and funding." },
      { href: "/professionals", label: "Professional card", desc: "Approved on your offer letter." },
      { href: "/secured", label: "Secured card", desc: "Deposit-backed. Graduates on its own." },
    ],
  },
  {
    title: "Alien Intelligence",
    items: [{ href: "/ai", label: "AI credit building", desc: "A coach that builds your file toward 740." }],
  },
  {
    title: "Money transfer",
    items: [{ href: "/transfers", label: "Send home", desc: "Set-and-forget transfers to family." }],
  },
];

export const nav = [
  { href: "/safety", label: "Safety" },
  { href: "/news", label: "News" },
] as const;
