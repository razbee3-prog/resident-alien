/** Pure, testable page classifier used before spending a vision call. */
export function looksLikeLoginPage(url: string, text: string): boolean {
  if (/\/auth\/logon|\/signin|\/login|\/auth\//i.test(url)) return true;
  const t = text.slice(0, 4000);
  const loginSignals = /(log in|sign in|enter your password|forgot password|create an account|verify your identity|enter the code)/i.test(t);
  const accountSignals = /(vantagescore|your score|credit score|updated (today|yesterday|on)|credit factors|accounts)/i.test(t);
  return loginSignals && !accountSignals;
}

/**
 * Intuit's post-login hand-off (`/update?code=…&redirectUrl=…`): reached when a logged-in user opens the marketing home.
 * It can sit on a spinner indefinitely. Not a login page, but nothing to read either.
 */
export function isHandoffPage(url: string): boolean {
  return /\/update\?(?:[^#]*&)?code=/i.test(url);
}

export type ScoreFacts = {
  score: number | null;
  score_model: string | null;
  bureau: string | null;
  as_of: string | null;
  confidence: string;
  utilization_percent: number | null;
  on_time_percent: number | null;
  total_accounts: number | null;
  derogatory_marks: number | null;
  observations: string;
};

/** "814 VantageScore 3.0, TransUnion, as of 2026-09-13" or "no score legible". */
export function scoreLine(x: ScoreFacts): string {
  if (x.score === null) return "no score legible";
  return `${x.score}${x.score_model ? ` ${x.score_model}` : ""}${x.bureau ? `, ${x.bureau}` : ""}${x.as_of ? `, as of ${x.as_of}` : ""}`;
}

/** The note the coach gets when a Credit Karma read lands, whichever path read it. */
export function connectedNote(x: ScoreFacts): string {
  return `Credit Karma read just now: score ${scoreLine(x)} (confidence ${x.confidence}). Utilization ${x.utilization_percent ?? "n/a"}%, on-time ${x.on_time_percent ?? "n/a"}%, accounts ${x.total_accounts ?? "n/a"}, derogatory ${x.derogatory_marks ?? "n/a"}. Observations: ${x.observations} A snapshot was recorded; the connection is active and will be re-read weekly.`;
}

/** A score is worth mentioning when it is the first one or moved at least this much. */
export const MATERIAL_SCORE_DELTA = 10;

export function scoreDelta(current: number | null, previous: number | null): { delta: number | null; material: boolean } {
  if (current === null) return { delta: null, material: false };
  if (previous === null) return { delta: null, material: true };
  const delta = current - previous;
  return { delta, material: Math.abs(delta) >= MATERIAL_SCORE_DELTA };
}
