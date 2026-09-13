export type Segment = "student" | "professional";

export type SegmentContent = {
  key: Segment;
  label: string;
  plural: string;
  pill: string;
  href: "/students" | "/professionals";
  headline: string;
  sub: string;
  evidence: string[];
  limit: string;
  unlock: string;
  coachFocus: string;
  risk: string;
  timeline: { month: string; step: string }[];
  faq: { q: string; a: string }[];
};

export const segments: Record<Segment, SegmentContent> = {
  professional: {
    key: "professional",
    label: "Professional",
    plural: "Professionals",
    pill: "PROFESSIONAL",
    href: "/professionals",
    headline: "Your offer letter is your credit history.",
    sub: "A Visa credit card approved on a signed offer, before your first paycheck. Reassessed the day payroll lands.",
    evidence: [
      "Offer letter and start date",
      "Salary, then payroll once it lands",
      "Savings and cash flow",
      "Rent and remittance obligations",
      "Foreign credit history (optional)",
    ],
    limit: "$1,000–$2,500",
    unlock: "First payroll deposit",
    coachFocus:
      "Fast, clean file growth toward Platinum and Reserve while staying under Chase’s 5/24.",
    risk: "One sponsor. A layoff hits money and status together, so we plan the buffer with you.",
    timeline: [
      { month: "Day 0", step: "Starter line opens on your offer letter, savings, and start date." },
      { month: "Month 1", step: "First payroll lands. Line reassessed upward." },
      { month: "Month 6", step: "First FICO score appears." },
      { month: "Month 9–12", step: "Mainstream 1.5–2% cash-back card." },
      { month: "Month 12–18", step: "Mid-tier travel card, Sapphire Preferred class." },
      { month: "Month 12–24", step: "Platinum or Reserve consideration at 720–740+ with a clean file." },
    ],
    faq: [
      {
        q: "I haven’t started yet. Can I apply?",
        a: "That’s the point. A signed offer letter with a start date, plus savings to cover the gap, is evidence. Your line is reassessed when the first payroll deposit lands.",
      },
      {
        q: "What if I get laid off?",
        a: "Your file keeps reporting as long as you keep paying. The coach switches to a protect-the-file plan: minimum spend, autopay from savings, no new applications. Status questions go to an immigration attorney, not us.",
      },
      {
        q: "Do I need an SSN?",
        a: "You’ll get one through your employer. If the card partner allows a passport or ITIN start, we’ll say so plainly. We won’t claim it until it’s true.",
      },
      {
        q: "Can I use my credit history from home?",
        a: "Optionally. Some countries’ bureaus can be read through a partner. It helps the starter decision; it doesn’t create a U.S. score.",
      },
    ],
  },
  student: {
    key: "student",
    label: "Student",
    plural: "Students",
    pill: "STUDENT",
    href: "/students",
    headline: "A real credit score before you graduate.",
    sub: "A Visa credit card approved on your I-20 and funding, before your first semester ends. Graduate with a score, not a blank.",
    evidence: [
      "I-20 and enrollment",
      "Scholarship, sponsor, or family funds",
      "Savings in a U.S. account",
      "Any authorized on-campus income",
      "Rent and phone obligations",
    ],
    limit: "$500–$1,500",
    unlock: "On-time payments plus confirmed enrollment each term",
    coachFocus:
      "Small recurring spend, autopay, a low utilization cap, and no store-card detours. Graduate with 720 in reach.",
    risk: "Funding is real but it isn’t W-2 income. We read it as capacity, and keep the line sized to it.",
    timeline: [
      { month: "Week 1", step: "Starter line opens on your I-20, funding letter, and savings." },
      { month: "Term 1", step: "Autopay on a small recurring bill. Utilization capped at 10%." },
      { month: "Month 6", step: "First FICO score appears." },
      { month: "Year 1", step: "Enrollment confirmed, line reassessed upward." },
      { month: "Year 2", step: "Mainstream cash-back card. Mid-tier travel card if income supports it." },
      { month: "Graduation", step: "OPT starts with a 12–24 month file, not a blank one." },
    ],
    faq: [
      {
        q: "I can’t work off campus. How can I have a credit card?",
        a: "The line is sized to your funding and savings, not a paycheck. Small, recurring, paid in full. That’s what builds the file.",
      },
      {
        q: "Is this a secured card?",
        a: "Not by default. Secured is the fallback when the evidence doesn’t support a starter line yet, and we say so plainly.",
      },
      {
        q: "Will this hurt my visa?",
        a: "A credit card is not employment. Keep authorized-work rules with your DSO; the card just reports on-time payments.",
      },
      {
        q: "What happens after graduation?",
        a: "You keep the account and the file. When OPT or H-1B income arrives, the coach reassesses for a larger line and the premium-card path.",
      },
    ],
  },
};

export const SEGMENT_KEY = "ra.segment";
