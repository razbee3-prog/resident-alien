/**
 * A skill = instructions + allowed tools + rules. One agent loads the skills the router picks; tools not in the
 * union are refused by the executor (the full tool list is always sent so the prompt cache stays warm).
 */

export type ToolName =
  | "get_state"
  | "update_profile"
  | "set_goal"
  | "create_plan_version"
  | "set_weekly_task"
  | "complete_task"
  | "write_memory"
  | "log_progress"
  | "flag_for_human"
  | "calc_utilization"
  | "calc_safe_payment"
  | "calc_safe_remittance"
  | "calc_payment_recommendation"
  | "assess_readiness"
  | "request_credit_link"
  | "get_credit_snapshots";

export type SkillName = "onboarding" | "credit_coach" | "plan_and_goals" | "cash_flow" | "smalltalk";

export const BASE_TOOLS: ToolName[] = ["get_state", "update_profile", "write_memory", "log_progress", "flag_for_human"];

export const skills: Record<SkillName, { description: string; tools: ToolName[]; section: string }> = {
  onboarding: {
    description: "First contact: consent, goal, minimal context, plan v1.",
    tools: ["set_goal", "create_plan_version", "set_weekly_task", "assess_readiness", "calc_utilization", "calc_safe_payment", "calc_safe_remittance", "request_credit_link"],
    section: `## Skill: onboarding
- Follow the stage instruction exactly. One question per turn. Warm, brief, no lists.
- Never guess a fact; ask. Record facts with update_profile the moment you learn them.
- Translate a score target into the real-life outcome it unlocks before calling set_goal.`,
  },
  credit_coach: {
    description: "Credit education, newcomer navigation, report understanding, dispute triage.",
    tools: ["calc_utilization", "calc_payment_recommendation", "complete_task", "set_weekly_task", "request_credit_link", "get_credit_snapshots"],
    section: `## Skill: credit_coach
- Teach from the knowledge sections only. If the answer is not there, say you are not sure and give the safe default.
- When utilization or a payment comes up, call the calculator with the user's numbers; explain the result, do not do the math yourself.
- Explain statement balance vs current balance vs minimum whenever a payment question could be misread.
- Formal dispute intent → flag_for_human(formal_dispute) and route to the secure flow. Never draft a dispute by text.
- If the user reports this week's action done or impossible, call complete_task and then set_weekly_task with the next action, so a week never goes without one.`,
  },
  plan_and_goals: {
    description: "Long-horizon planning: goals, milestones, weekly action, plan versions.",
    tools: ["set_goal", "create_plan_version", "set_weekly_task", "complete_task", "assess_readiness", "calc_utilization", "calc_safe_payment", "calc_payment_recommendation", "request_credit_link", "get_credit_snapshots"],
    section: `## Skill: plan_and_goals
- Exactly one primary action for the current week. If the user completed or declined it, call complete_task, then set_weekly_task with the next safest highest-value action.
- Material change (income, deadline, payment failure, account opened, reporting confirmed) → create_plan_version with a rationale that names the change. Never rewrite history; version it.
- Never plan an action that needs unaffordable debt or touches the protected reserve.`,
  },
  cash_flow: {
    description: "Affordability, safe payment, safe remittance, protect-the-essentials.",
    tools: ["calc_safe_payment", "calc_safe_remittance", "calc_payment_recommendation", "calc_utilization", "assess_readiness", "get_credit_snapshots"],
    section: `## Skill: cash_flow
- Reserve rent, food, tuition, utilities, health, and the emergency buffer before any score-optimization payment.
- Compute safe-to-send and safe-payment with the calculators from the user's stated numbers; if a number is missing, ask for it (one question).
- Never suggest funding a remittance with credit. When fees or rates are not live, say so and explain how to compare.`,
  },
  smalltalk: {
    description: "Greetings, thanks, off-topic; keep it short and steer back to the plan.",
    tools: [],
    section: `## Skill: smalltalk
- One or two sentences. Friendly, then a light pointer back to this week's action if there is one.`,
  },
};

export function allowedTools(names: SkillName[]): Set<ToolName> {
  const s = new Set<ToolName>(BASE_TOOLS);
  for (const n of names) for (const t of skills[n].tools) s.add(t);
  return s;
}

export function skillSections(names: SkillName[]): string {
  return names.map((n) => skills[n].section).join("\n\n");
}
