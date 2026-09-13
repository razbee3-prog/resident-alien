/** Pure, testable page classifier used before spending a vision call. */
export function looksLikeLoginPage(url: string, text: string): boolean {
  if (/\/auth\/logon|\/signin|\/login|\/auth\//i.test(url)) return true;
  const t = text.slice(0, 4000);
  const loginSignals = /(log in|sign in|enter your password|forgot password|create an account|verify your identity|enter the code)/i.test(t);
  const accountSignals = /(vantagescore|your score|credit score|updated (today|yesterday|on)|credit factors|accounts)/i.test(t);
  return loginSignals && !accountSignals;
}

/** A score is worth mentioning when it is the first one or moved at least this much. */
export const MATERIAL_SCORE_DELTA = 10;

export function scoreDelta(current: number | null, previous: number | null): { delta: number | null; material: boolean } {
  if (current === null) return { delta: null, material: false };
  if (previous === null) return { delta: null, material: true };
  const delta = current - previous;
  return { delta, material: Math.abs(delta) >= MATERIAL_SCORE_DELTA };
}
