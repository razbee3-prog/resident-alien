/**
 * Numbered options in a coach message ("1. No U.S. credit yet") and what a bare digit reply means. Pure, tested.
 * The coach asks with 1 / 2 / 3 when a question has a few discrete answers; the user taps one digit back.
 */
export type NumberedOption = { n: number; label: string };

/** The menu in a coach message: consecutive lines "N. label" starting at 1. Numbers inside prose are not options. */
export function parseOptions(coachText: string | null | undefined): NumberedOption[] {
  if (!coachText) return [];
  const out: NumberedOption[] = [];
  for (const line of coachText.split(/\r?\n/)) {
    const m = line.match(/^\s*([1-9])[.)]\s+(.+?)\s*$/);
    if (m) out.push({ n: Number(m[1]), label: m[2] });
  }
  const ns = out.map((o) => o.n);
  if (ns.length < 2 || ns[0] !== 1 || ns.some((n, i) => i > 0 && n !== ns[i - 1] + 1)) return [];
  return out;
}

/** "2", "2.", "2)", "option 2", "#2" → option 2 of the coach's last message, if it had one. */
export function pickedOption(userText: string, coachText: string | null | undefined): NumberedOption | null {
  const m = userText.trim().match(/^(?:option|#|number|no\.?)?\s*([1-9])\s*[.)]?\s*$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return parseOptions(coachText).find((o) => o.n === n) ?? null;
}

/** The user's digit with its meaning spelled out for the model, the router, and the memory writer; null if not a pick. */
export function expandNumberedReply(userText: string, coachText: string | null | undefined): string | null {
  const o = pickedOption(userText, coachText);
  return o ? `${userText.trim()} (picked option ${o.n}: ${o.label})` : null;
}
