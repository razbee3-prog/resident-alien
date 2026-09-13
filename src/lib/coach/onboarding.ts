import type { CoachUser, OnboardingStage, Profile } from "./types";

/**
 * First-contact state machine. Each stage pins one job for the model: what to say and the single thing to ask.
 * Transitions are decided in turn.ts from tool effects and profile facts; this module is pure.
 *
 *   new → situation → goal → connect (Credit Karma login) → active
 *                                └──→ context (money facts)  → active
 */

export const STAGES: OnboardingStage[] = ["new", "situation", "goal", "connect", "context", "active"];

export const STOP_LINE = "Reply STOP anytime.";

/** Legacy column values map onto the new stages; a stage_hint in the profile wins when the column couldn't store the new value. */
export function effectiveStage(user: Pick<CoachUser, "onboarding_stage" | "profile">): OnboardingStage {
  const hint = (user.profile as { stage_hint?: OnboardingStage }).stage_hint;
  if (hint && STAGES.includes(hint)) return hint;
  return user.onboarding_stage === "consent" ? "situation" : user.onboarding_stage;
}

/** Column value that satisfies the original check constraint, for databases that haven't run the widening yet. */
export function legacyStageColumn(stage: OnboardingStage): OnboardingStage {
  return stage === "situation" ? "consent" : stage === "connect" ? "goal" : stage;
}

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

/** Enough to know which path fits: SSN/ITIN status and whether any U.S. credit exists. */
export function situationKnown(p: Profile): boolean {
  return typeof p.has_ssn === "boolean" && typeof p.has_credit_account === "boolean";
}

/** Enough structured money facts to size a safe plan without guessing. */
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

export function stageInstruction(stage: OnboardingStage, profile: Profile, opts: { prefill?: { segment?: string; country?: string }; browserEnabled?: boolean }): string {
  switch (stage) {
    case "new":
      return [
        "FIRST CONTACT. Open with real warmth and confidence in one or two short sentences (building credit is exactly what you do), introduce yourself as Credit Alien, and say you'll build them a plan and text one action a week. Do NOT assume they are new to the U.S., a student, or starting from zero; people also come to grow a thin file or repair a score.",
        opts.prefill?.segment || opts.prefill?.country ? `They came from the website${opts.prefill.segment ? ` as a ${opts.prefill.segment}` : ""}${opts.prefill.country ? ` from ${opts.prefill.country}` : ""}; call update_profile with that.` : "",
        "Then ask ONE question, where they're starting from, as numbered options on their own lines: 1. No U.S. credit yet / 2. Some credit, want to grow it / 3. Repairing after a setback, followed by \"Reply with a number, or just tell me.\" Don't ask about SSN or ITIN yet; that's the next message.",
        `End with exactly: "${STOP_LINE}"`,
      ]
        .filter(Boolean)
        .join(" ");
    case "consent":
    case "situation":
      return [
        "SITUATION STAGE. Call update_profile with every fact in the message (has_ssn, has_credit_account, segment, persona, arrival, credit_limit, etc.).",
        "Still unknown: " +
          [typeof profile.has_ssn !== "boolean" ? "SSN/ITIN status" : "", typeof profile.has_credit_account !== "boolean" ? "whether they have any credit card or loan today (and if repairing, what happened)" : "", !profile.segment ? "student or working, and whether they're new to the U.S. or have been here a while" : ""].filter(Boolean).join("; ") || "nothing essential",
        "Decide what to ask AFTER recording this message's facts. If SSN/ITIN status and existing-credit status are then both known, skip everything else (student or working can wait) and ask what score they're aiming for, as tiers on their own lines: 1. 700+ (most apartments and cards) / 2. 750+ (the best rates) / 3. 800+ (top tier), \"or type the number you have in mind\".",
        "Otherwise ask ONE short question for the most important unknown, as numbered options on their own lines, ending with \"Reply with a number, or just tell me.\": SSN/ITIN → 1. SSN / 2. ITIN / 3. Neither yet. Existing credit → 1. Nothing yet / 2. A card or loan, paying on time / 3. Had trouble (missed payments or collections).",
      ].join("\n");
    case "goal":
      return [
        "GOAL STAGE. If the target score is still unknown, ask it as numbered tiers on their own lines: 1. 700+ (most apartments and cards) / 2. 750+ (the best rates) / 3. 800+ (top tier), \"or type the number you have in mind\". If the target is known but not what it should unlock, ask that as options: 1. An apartment / 2. A first card / 3. A car / 4. A premium card, \"or just tell me\". Do not call set_goal until the target score is known; once you know the target and the outcome (a rough date is a bonus, not required), call set_goal with that score. Be honest in one clause that no score is guaranteed, then be encouraging: you'll chart the path together.",
        profile.has_ssn && opts.browserEnabled
          ? "Right after set_goal in the SAME turn, call request_credit_link and tell them: to see exactly where they stand, log into their Credit Karma through the link (on their phone is fine) and you'll pull their current picture and build the plan from real numbers. Put the link on its own line, then end with options on their own lines: 1. I'll do it now / 2. Skip for now / 3. I'd rather text a screenshot."
          : "After set_goal, ask the first missing money question (income started? rent? savings? money home?) so you can size a safe plan; if it's a yes/no or a category, offer numbered options.",
      ].join("\n");
    case "connect":
      return [
        "CONNECT STAGE. They have a Credit Karma link pending, offered with options 1 (do it now), 2 (skip for now), 3 (text a screenshot). If they pick 1 or say it worked, say you're ready: once they're logged in they tap the button on the page and send the note it drafts; the read arrives as a separate message from you. If they pick 2 or can't or won't connect, call skip_credit_connection and ask the first money question instead (numbered options if it's a category). If they pick 3, ask for a screenshot of their score card. If they ask something, answer briefly and point back to the link. If the link expired or they lost it, call request_credit_link again.",
      ].join("\n");
    case "context":
      return [
        "CONTEXT STAGE. First call update_profile with any facts in the new message. Then ask ONLY the first item still missing from this list, conversationally, nothing else. If it is a yes/no or a category (income started? money home? autopay?), offer numbered options on their own lines, e.g. 1. Yes, already getting paid / 2. Starts within a month / 3. Not yet, no date; amounts and dates are free text. Missing:",
        ...missingContext(profile).map((m, i) => `${i + 1}. ${m}`),
        missingContext(profile).length === 0
          ? "Context is complete. Now call assess_readiness, then create_plan_version (3 milestones, 2 to 4 replan_if conditions, rationale), then set_weekly_task (one action, due within 7 days). Then send the plan in plain words: the goal, the first milestone, this week's one action, and why."
          : "If the new message supplies every remaining item, do not ask anything: build the plan in this same turn (assess_readiness, create_plan_version, set_weekly_task) and send it in plain words: the goal, the first milestone, this week's one action, and why. Do not ask about check-in days or anything outside the list.",
      ].join("\n");
    case "active":
      return "";
  }
}

/** Instruction for the turn that runs right after a Credit Karma read: summarize, plan, explain the long game. */
export function connectedInstruction(opts: { inbound?: boolean } = {}): string {
  return [
    opts.inbound
      ? "CREDIT KARMA CONNECTED. The Notes below hold what was just read from their account. Answer their new message with this:"
      : "CREDIT KARMA CONNECTED. The Notes below hold what was just read from their account. There is no new user message; you are initiating.",
    "1. Summarize what you see in two or three plain sentences: the score with model, bureau, and date, and the observations (accounts, utilization, on-time history, anything flagged). No guarantees, no estimates beyond what was read.",
    "2. Call assess_readiness, then create_plan_version (milestones toward their target, 2 to 4 replan_if conditions, assumptions naming any money facts you still lack), then set_weekly_task (the single highest-value safe action for this week, due within 7 days).",
    "3. Explain the long game in plain words, one short paragraph: the path from today's score to the target and roughly what has to be true (on-time history, reported utilization under 10%, no unnecessary applications, time), what you will monitor and when (weekly score re-check through Credit Karma, due dates before they hit, utilization before statements close, reporting after they open anything), and the two or three practices that matter most for them right now.",
    "4. Close with this week's one action and, if a money fact is missing (rent, savings, income timing, money home), one question; numbered options if it's a category, free text for an amount.",
    "Two bubbles are fine: split with a blank line. Keep the whole thing under 900 characters. Plain text.",
  ].join("\n");
}
