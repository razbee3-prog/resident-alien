import type { OnboardingStage, Profile } from "./types";

/**
 * First-contact state machine. Each stage pins one job for the model: what to say and the single question to ask.
 * Transitions are decided in turn.ts from user text and tool calls; this module is pure.
 */

export const STAGES: OnboardingStage[] = ["new", "consent", "goal", "context", "active"];

export const CONSENT_LINE = "Reply YES to get coaching texts from Credit Alien. Msg & data rates may apply. Reply STOP anytime.";

export function parseButtonPrefill(text: string): { segment?: "student" | "professional"; country?: string } {
  const out: { segment?: "student" | "professional"; country?: string } = {};
  const seg = text.match(/\b(student|professional)\b/i)?.[1]?.toLowerCase();
  if (seg === "student" || seg === "professional") out.segment = seg;
  const iso = text.match(/\bfrom\s+([A-Z]{3})\b/)?.[1];
  if (iso) out.country = iso.toUpperCase();
  return out;
}

export function isAffirmative(text: string): boolean {
  return /^\s*(yes|yes+|yeah|yep|yup|ya|sure|ok|okay|absolutely|let'?s go|sounds good|i'?m in|👍|y|si|sí|haan|ha)\b/i.test(text) || /👍|✅/.test(text);
}

/** Enough structured context to build plan v1 without guessing. */
export function contextComplete(p: Profile): boolean {
  const hasCash = typeof p.savings === "number" || typeof p.annual_income === "number";
  return typeof p.income_started === "boolean" && typeof p.rent === "number" && typeof p.remittance_monthly === "number" && hasCash && typeof p.has_credit_account === "boolean";
}

export function missingContext(p: Profile): string[] {
  const missing: string[] = [];
  if (typeof p.income_started !== "boolean") missing.push("whether income (payroll or funding) has started landing in a U.S. account, and if not, roughly when");
  if (typeof p.annual_income !== "number" && typeof p.savings !== "number") missing.push("rough annual income or funding, and savings in the U.S.");
  if (typeof p.rent !== "number") missing.push("monthly rent (and rough essentials: food, phone, transit)");
  if (typeof p.remittance_monthly !== "number") missing.push("whether they send money home each month, and roughly how much (0 is fine)");
  if (typeof p.has_credit_account !== "boolean") missing.push("whether they already have any U.S. credit card or credit-builder account, and whether they have an SSN yet");
  return missing;
}

export function stageInstruction(stage: OnboardingStage, profile: Profile, opts: { prefill?: { segment?: string; country?: string }; consentPending?: boolean }): string {
  switch (stage) {
    case "new":
      return [
        "FIRST CONTACT. Introduce yourself in two or three short sentences: you are Credit Alien, the Resident Alien coach; you build a plan for their U.S. credit and send one action a week by text.",
        opts.prefill?.segment || opts.prefill?.country ? `They came from the website${opts.prefill.segment ? ` as a ${opts.prefill.segment}` : ""}${opts.prefill.country ? ` from ${opts.prefill.country}` : ""}; acknowledge that in a few words and call update_profile with it.` : "",
        `End with exactly this line: "${CONSENT_LINE}"`,
        "Ask nothing else this turn.",
      ]
        .filter(Boolean)
        .join(" ");
    case "consent":
      return opts.consentPending
        ? `They have not clearly said YES yet. Answer anything they asked in one or two sentences, then repeat exactly: "${CONSENT_LINE}"`
        : "They just consented. Thank them in a few words, then ask ONE question: what do they want credit to unlock, and roughly by when? Give two or three examples (an apartment without a huge deposit, a first real card, a car, or simply a score that exists). Do not ask about money yet.";
    case "goal":
      return "GOAL STAGE. When you know the real-life outcome and a rough date, call set_goal (translate a bare score target into the outcome it unlocks; ask if unclear). After set_goal, ask the FIRST missing context question below. One question per turn.";
    case "context":
      return [
        "CONTEXT STAGE. Ask ONE missing item per turn, conversationally, and call update_profile as soon as you learn a fact. Missing:",
        ...missingContext(profile).map((m, i) => `${i + 1}. ${m}`),
        missingContext(profile).length === 0
          ? "Context is complete. Now call assess_readiness, then create_plan_version (3 milestones, 2 to 4 replan_if conditions, rationale), then set_weekly_task (one action, due within 7 days). Then send the plan in plain words: the goal, the first milestone, this week's one action, and why."
          : "Do not build the plan until the list is empty.",
      ].join("\n");
    case "active":
      return "";
  }
}
