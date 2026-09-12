/** Platform guardrails. Pure functions: run before storage/model on the way in, and before sending on the way out. */

export type PiiKind = "ssn_or_itin" | "card_number" | "bank_account" | "passport" | "secret";
export type PiiHit = { kind: PiiKind; sample: string };

function luhn(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

const patterns: { kind: PiiKind; re: RegExp; test?: (m: string) => boolean }[] = [
  { kind: "card_number", re: /\b(?:\d[ -]?){13,19}\b/g, test: (m) => luhn(m.replace(/\D/g, "")) },
  { kind: "ssn_or_itin", re: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g },
  { kind: "bank_account", re: /\b(?:acct|account|routing|iban|swift)(?:\s+(?:number|no\.?|#))?\s*(?:is|:)?\s*[A-Z]{0,2}\d{8,17}\b/gi },
  { kind: "passport", re: /\bpassport(?:\s+(?:number|no\.?|#))?\s*(?:is|:)?\s*[A-Z]{0,2}\d{6,9}\b/gi },
  { kind: "secret", re: /\b(?:password|passcode|pin|otp|one[- ]time code|cvv|cvc)\s*(?:is|:)?\s*\S+/gi },
];

export function redactPii(text: string): { text: string; hits: PiiHit[] } {
  const hits: PiiHit[] = [];
  let out = text;
  for (const p of patterns) {
    out = out.replace(p.re, (m) => {
      if (p.test && !p.test(m)) return m;
      hits.push({ kind: p.kind, sample: m.slice(0, 4) + "…" });
      return `[${p.kind} removed]`;
    });
  }
  return { text: out, hits };
}

export const PII_WARNING =
  "For your security, please don’t send account numbers, passwords, SSNs, or document numbers by text. I’ve removed that from our chat. When we need something sensitive, I’ll send you a secure link instead.";

export function isOptOut(text: string): boolean {
  return /^\s*(stop|stopall|unsubscribe|cancel|end|quit|opt\s*out|revoke)\b/i.test(text);
}
export function isOptIn(text: string): boolean {
  return /^\s*(start|unstop|resume)\b/i.test(text);
}

/** Questions we must route to qualified resources rather than answer. */
export function isImmigrationStatusQuestion(text: string): boolean {
  return /\b(ice|deport(?:ation|ed)?|out of status|immigration status|my (?:visa|status|i-?94)(?!\s*(?:card|debit|credit))|uscis|green card|asylum|raid|detained|sevis)\b/i.test(text) && /\?|should|can i|what if|will i|am i/i.test(text);
}

export const IMMIGRATION_REFERRAL =
  "That’s a status question, and I don’t give immigration or legal advice. Talk to your DSO (students), your employer’s immigration counsel, or a licensed immigration attorney. For emergencies, the site’s Safety page lists hotlines. Happy to keep going on the money side whenever you want.";

/** Claims the outbound guard rejects. Returns the offending phrases. */
export function outboundProblems(text: string): string[] {
  const rules: RegExp[] = [
    /\bguarantee[sd]?\b/i,
    /\b(will|going to) (be )?(get )?approved\b/i,
    /\byou(’|')?ll (get|be) approved\b/i,
    /\bscore will (go up|rise|increase|jump|hit|reach)\b/i,
    /\b(definitely|certainly|100%) (get|be) approved\b/i,
    /\bcarry(ing)? a balance (helps|builds|improves)/i,
    /\b(use|put it on|charge it to) (your|the) (credit )?card (to|for) (send|remit|wire)/i,
  ];
  return rules.map((r) => text.match(r)?.[0]).filter((m): m is string => Boolean(m));
}

export const OUTBOUND_FALLBACK =
  "Quick correction from me: nothing about credit is guaranteed, and I never recommend carrying a balance or funding transfers home with a card. Want me to walk through the safe version of this?";
