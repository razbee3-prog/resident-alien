import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { assess, type ReadinessInput } from "@/lib/readiness";
import { site } from "@/lib/site";
import { browserEnabled } from "./browser-flag";
import { paymentRecommendation, safePayment, safeRemittance, utilization } from "./finance";
import type { ToolName } from "./skills";
import * as store from "./store";
import type { CoachUser, Memory, Plan, Profile, Progress, Task } from "./types";

/* ----------------------------- definitions ----------------------------- */

const num = { type: "number" } as const;
const str = { type: "string" } as const;
const nullable = (t: "number" | "string") => ({ type: [t, "null"] }) as const;

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "get_state",
    description: "Load the user's current goal, plan (milestones), this week's task, profile numbers, and recent progress. Call when you need a fact you don't see in the context.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
  {
    name: "update_profile",
    description:
      "Record durable facts the user just stated. Only include keys you learned this turn. Money in USD per month unless the key says annual. Never store SSNs, card, passport, or account numbers.",
    input_schema: {
      type: "object",
      properties: {
        name: str,
        segment: { type: "string", enum: ["student", "professional"] },
        country: { type: "string", description: "ISO-3 country code they moved from" },
        persona: { type: "string", enum: ["f1_student", "opt_worker", "h1b_worker", "other"] },
        arrival: { type: "string", description: "YYYY-MM" },
        income_started: { type: "boolean" },
        days_to_start: num,
        annual_income: num,
        savings: num,
        rent: num,
        essentials: { type: "number", description: "food, phone, transit, utilities per month" },
        remittance_monthly: num,
        emergency_reserve: num,
        next_income_date: { type: "string", description: "YYYY-MM-DD" },
        has_ssn: { type: "boolean" },
        has_us_bank: { type: "boolean" },
        has_credit_account: { type: "boolean" },
        credit_limit: num,
        current_balance: num,
        statement_balance: num,
        minimum_payment: num,
        payment_due_day: { type: "integer", description: "Day of month, 1-31" },
        statement_close_day: { type: "integer", description: "Day of month, 1-31" },
        autopay: { type: "boolean" },
        foreign_credit: { type: "boolean" },
        preferred_checkin: { type: "string", description: "e.g. Sunday evening" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "set_goal",
    description: "Set the user's primary goal once you know the real-life outcome and a rough date. Replaces any earlier active goal.",
    input_schema: {
      type: "object",
      properties: {
        outcome_type: { type: "string", enum: ["apartment", "first_card", "car", "score_exists", "lower_borrowing_cost", "premium_card", "other"] },
        description: { type: "string", description: "One sentence in the user's words" },
        score_target: nullable("number"),
        target_date: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
      },
      additionalProperties: false,
      required: ["outcome_type", "description", "score_target", "target_date"],
    },
    strict: true,
  },
  {
    name: "create_plan_version",
    description: "Create a new plan version (never edits the old one). Use at onboarding and after any material change. Three milestones, ordered; the first is active.",
    input_schema: {
      type: "object",
      properties: {
        rationale: { type: "string", description: "Why this plan, and what changed if it's a new version" },
        milestones: {
          type: "array",
          description: "2 to 5 milestones in order",
          items: {
            type: "object",
            properties: { id: str, outcome: str, status: { type: "string", enum: ["pending", "active", "complete"] } },
            required: ["id", "outcome", "status"],
            additionalProperties: false,
          },
        },
        replan_if: { type: "array", items: str, description: "Conditions that trigger a new version" },
        assumptions: { type: "object", description: "Numbers and dates the plan rests on", additionalProperties: true },
      },
      additionalProperties: false,
      required: ["rationale", "milestones", "replan_if"],
    },
  },
  {
    name: "set_weekly_task",
    description: "Set THE one action for this week. Expires any previous active task.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Imperative, specific, with the user's numbers" },
        rationale: str,
        action_type: { type: "string", enum: ["autopay", "payment", "spend_cap", "open_account", "verify_reporting", "gather_document", "check_report", "cash_buffer", "remittance_plan", "wait", "other"] },
        success_condition: { type: "string", description: "How we'll know it's done" },
        due_in_days: { type: "integer", description: "1 to 14" },
      },
      additionalProperties: false,
      required: ["title", "rationale", "action_type", "success_condition", "due_in_days"],
    },
    strict: true,
  },
  {
    name: "complete_task",
    description: "Mark this week's task done or skipped based on what the user reported.",
    input_schema: {
      type: "object",
      properties: { outcome: { type: "string", enum: ["done", "skipped"] }, note: str },
      additionalProperties: false,
      required: ["outcome", "note"],
    },
    strict: true,
  },
  {
    name: "write_memory",
    description: "Save a stable preference, constraint, fact, or event the user stated. Not for things you inferred.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["preference", "constraint", "fact", "event"] },
        summary: { type: "string", description: "One sentence, third person, with numbers" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        expires_in_days: nullable("number"),
      },
      additionalProperties: false,
      required: ["kind", "summary", "confidence", "expires_in_days"],
    },
    strict: true,
  },
  {
    name: "log_progress",
    description: "Note movement on this week's task: advance, neutral, off_track, or complete.",
    input_schema: {
      type: "object",
      properties: { kind: { type: "string", enum: ["advance", "neutral", "off_track", "complete"] }, note: str },
      additionalProperties: false,
      required: ["kind", "note"],
    },
    strict: true,
  },
  {
    name: "flag_for_human",
    description: "Escalate: formal dispute, suspected fraud, hardship, immigration question, or a request you must not fulfil.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string", enum: ["formal_dispute", "fraud_suspected", "hardship", "immigration_question", "unsafe_request", "other"] }, note: str },
      additionalProperties: false,
      required: ["reason", "note"],
    },
    strict: true,
  },
  {
    name: "calc_utilization",
    description: "Utilization from a balance and credit limit, with the paydown needed to reach 10%.",
    input_schema: { type: "object", properties: { balance: num, credit_limit: num }, additionalProperties: false, required: ["balance", "credit_limit"] },
    strict: true,
  },
  {
    name: "calc_safe_payment",
    description: "Maximum card payment that still protects essentials and the emergency reserve.",
    input_schema: {
      type: "object",
      properties: { available_cash: num, protected_essentials: num, emergency_reserve: num, required_minimum_payment: num },
      additionalProperties: false,
      required: ["available_cash", "protected_essentials", "emergency_reserve", "required_minimum_payment"],
    },
    strict: true,
  },
  {
    name: "calc_safe_remittance",
    description: "Amount safe to send home after essentials, reserve, required debt payments, and the transfer fee.",
    input_schema: {
      type: "object",
      properties: { available_cash: num, protected_essentials: num, emergency_reserve: num, required_debt_payments: num, transfer_fee: num },
      additionalProperties: false,
      required: ["available_cash", "protected_essentials", "emergency_reserve", "required_debt_payments", "transfer_fee"],
    },
    strict: true,
  },
  {
    name: "calc_payment_recommendation",
    description: "What to pay on the card this cycle: statement in full, down to 10% utilization, or the minimum, whichever cash allows after essentials.",
    input_schema: {
      type: "object",
      properties: { statement_balance: num, current_balance: num, credit_limit: num, minimum_payment: num, available_cash: num, protected_essentials: num, emergency_reserve: num },
      additionalProperties: false,
      required: ["statement_balance", "current_balance", "credit_limit", "minimum_payment", "available_cash", "protected_essentials", "emergency_reserve"],
    },
    strict: true,
  },
  {
    name: "request_credit_link",
    description:
      "Create a one-time link (valid 15 minutes) where the user logs into Credit Karma on a LAPTOP so you can read their score and re-check it weekly. Use when they ask to connect or track their score. Phone users can instead text a screenshot of their score card, which you read automatically. Returns the URL to put in your reply.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
  {
    name: "get_credit_snapshots",
    description: "The user's recorded credit scores (newest first) with model, bureau, date, and source. The only place a score may come from.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
  {
    name: "assess_readiness",
    description: "Run the Resident Alien readiness engine on the profile (illustrative: path, starter-line range, safe-to-send, readiness for mainstream/mid-tier/premium). Not a credit decision.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
];

/* ------------------------------- executor ------------------------------ */

export type Effects = { profile?: Profile; goalSet?: boolean; planCreated?: Plan; taskSet?: Task; taskCompleted?: boolean; escalated?: string };
export type ToolCallLog = { name: string; input: unknown; ok: boolean; result: string; ms: number };

export type ToolContext = { user: CoachUser; allowed: Set<ToolName>; effects: Effects; log: ToolCallLog[] };

const PROFILE_KEYS: (keyof Profile)[] = [
  "name", "segment", "country", "persona", "arrival", "income_started", "days_to_start", "annual_income", "savings", "rent", "essentials",
  "remittance_monthly", "emergency_reserve", "next_income_date", "has_ssn", "has_us_bank", "has_credit_account", "credit_limit", "current_balance",
  "statement_balance", "minimum_payment", "payment_due_day", "statement_close_day", "autopay", "foreign_credit", "preferred_checkin",
];

export function readinessInput(p: Profile): ReadinessInput {
  return {
    segment: p.segment ?? "professional",
    annualIncome: p.annual_income ?? 0,
    savings: p.savings ?? 0,
    rent: p.rent ?? 0,
    essentials: p.essentials ?? 0,
    remittance: p.remittance_monthly ?? 0,
    daysToStart: p.income_started ? 0 : (p.days_to_start ?? 30),
    incomeStarted: p.income_started ?? false,
    foreignCredit: p.foreign_credit ?? false,
  };
}

export async function executeTool(name: string, rawInput: unknown, ctx: ToolContext): Promise<{ content: string; is_error?: boolean }> {
  const t0 = Date.now();
  const input = (rawInput ?? {}) as Record<string, unknown>;
  const done = (result: unknown, ok = true) => {
    const content = typeof result === "string" ? result : JSON.stringify(result);
    ctx.log.push({ name, input, ok, result: content.slice(0, 2000), ms: Date.now() - t0 });
    return ok ? { content } : { content, is_error: true };
  };
  if (!ctx.allowed.has(name as ToolName)) return done(`Tool ${name} is not available in the active skill. Answer from what you have or ask the user.`, false);
  const uid = ctx.user.id;
  const profile = ctx.effects.profile ?? ctx.user.profile;

  try {
    switch (name as ToolName) {
      case "get_state": {
        const [goal, plan, task, progress, memories] = await Promise.all([store.getActiveGoal(uid), store.getActivePlan(uid), store.getActiveTask(uid), store.recentProgress(uid, 5), store.listMemories(uid, 12)]);
        return done({ goal, plan: plan && { version: plan.version, rationale: plan.rationale, milestones: plan.milestones, replan_if: plan.replan_if }, task, profile, progress: progress.map(pr), memories: memories.map(mem), as_of: new Date().toISOString() });
      }
      case "update_profile": {
        const patch: Profile = {};
        for (const k of PROFILE_KEYS) if (input[k] !== undefined && input[k] !== null) (patch as Record<string, unknown>)[k] = input[k];
        const next = { ...profile, ...patch };
        const colPatch: Partial<CoachUser> = { profile: next };
        if (patch.segment) colPatch.segment = patch.segment;
        if (patch.country) colPatch.country = patch.country;
        if (patch.persona) colPatch.persona = patch.persona;
        await store.updateUser(uid, colPatch);
        ctx.effects.profile = next;
        return done({ ok: true, updated: Object.keys(patch) });
      }
      case "set_goal": {
        const goal = await store.setGoal(uid, {
          outcome_type: String(input.outcome_type),
          description: String(input.description),
          score_target: typeof input.score_target === "number" ? input.score_target : null,
          target_date: typeof input.target_date === "string" ? input.target_date : null,
        });
        ctx.effects.goalSet = true;
        return done({ ok: true, goal_id: goal.id });
      }
      case "create_plan_version": {
        const goal = await store.getActiveGoal(uid);
        const milestones = (Array.isArray(input.milestones) ? input.milestones : []) as Plan["milestones"];
        if (!milestones.some((m) => m.status === "active") && milestones[0]) milestones[0].status = "active";
        const plan = await store.createPlanVersion(uid, {
          goal_id: goal?.id ?? null,
          rationale: String(input.rationale ?? ""),
          milestones,
          replan_if: Array.isArray(input.replan_if) ? input.replan_if.map(String) : [],
          assumptions: (input.assumptions && typeof input.assumptions === "object" ? input.assumptions : {}) as Record<string, unknown>,
        });
        ctx.effects.planCreated = plan;
        return done({ ok: true, version: plan.version, plan_id: plan.id });
      }
      case "set_weekly_task": {
        const plan = ctx.effects.planCreated ?? (await store.getActivePlan(uid));
        const days = Math.min(14, Math.max(1, Number(input.due_in_days) || 7));
        const task = await store.setWeeklyTask(uid, {
          plan_id: plan?.id ?? null,
          title: String(input.title),
          rationale: String(input.rationale ?? ""),
          action_type: String(input.action_type ?? "other"),
          success_condition: String(input.success_condition ?? ""),
          due_at: new Date(Date.now() + days * 86400000).toISOString(),
        });
        ctx.effects.taskSet = task;
        return done({ ok: true, task_id: task.id, due_at: task.due_at });
      }
      case "complete_task": {
        const task = await store.getActiveTask(uid);
        if (!task) return done("No active task to complete.", false);
        const outcome = input.outcome === "skipped" ? "skipped" : "done";
        await store.updateTask(task.id, { status: outcome, completed_at: new Date().toISOString() });
        await store.insertProgress(uid, { task_id: task.id, kind: "complete", note: `${outcome}: ${String(input.note ?? "")}` });
        ctx.effects.taskCompleted = true;
        return done({ ok: true, task_id: task.id, outcome });
      }
      case "write_memory": {
        const days = typeof input.expires_in_days === "number" ? input.expires_in_days : null;
        const m = await store.insertMemory(uid, {
          kind: input.kind as Memory["kind"],
          summary: String(input.summary),
          source: "user_stated",
          confidence: (input.confidence as Memory["confidence"]) ?? "medium",
          expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
        });
        return done({ ok: true, memory_id: m.id });
      }
      case "log_progress": {
        const task = await store.getActiveTask(uid);
        await store.insertProgress(uid, { task_id: task?.id ?? null, kind: input.kind as Progress["kind"], note: String(input.note ?? "") });
        return done({ ok: true });
      }
      case "flag_for_human": {
        await store.insertEvent(uid, "escalation", { reason: input.reason, note: input.note });
        ctx.effects.escalated = String(input.reason);
        return done({ ok: true, message: "Logged for human review. Tell the user a person will follow up and, if relevant, that a secure link will come." });
      }
      case "calc_utilization":
        return done(utilization(Number(input.balance), Number(input.credit_limit)));
      case "calc_safe_payment":
        return done(safePayment({ availableCash: Number(input.available_cash), protectedEssentials: Number(input.protected_essentials), emergencyReserve: Number(input.emergency_reserve), requiredMinimumPayment: Number(input.required_minimum_payment) }));
      case "calc_safe_remittance":
        return done(safeRemittance({ availableCash: Number(input.available_cash), protectedEssentials: Number(input.protected_essentials), emergencyReserve: Number(input.emergency_reserve), requiredDebtPayments: Number(input.required_debt_payments), transferFee: Number(input.transfer_fee) }));
      case "calc_payment_recommendation":
        return done(paymentRecommendation({ statementBalance: Number(input.statement_balance), currentBalance: Number(input.current_balance), creditLimit: Number(input.credit_limit), minimumPayment: Number(input.minimum_payment), availableCash: Number(input.available_cash), protectedEssentials: Number(input.protected_essentials), emergencyReserve: Number(input.emergency_reserve) }));
      case "request_credit_link": {
        if (!browserEnabled) return done("The score check is not enabled on this deployment. Tell the user they can text a screenshot of their score page instead, and coach from what they tell you.", false);
        const conn = await store.ensureConnection(uid);
        const link = await store.issueLinkToken(uid, conn.id);
        return done({ url: `${site.url}/connect/${link.token}`, expires_in_minutes: 15, instructions: "Open on a laptop; log in to Credit Karma in the window; tap 'I'm logged in'." });
      }
      case "get_credit_snapshots": {
        const snaps = await store.listSnapshots(uid, 5);
        const conn = await store.getConnection(uid);
        return done({ connection: conn ? { status: conn.status, last_ok_at: conn.last_ok_at } : null, snapshots: snaps.map((x) => ({ score: x.score, score_model: x.score_model, bureau: x.bureau, as_of: x.as_of, source: x.source, recorded_at: x.created_at })) });
      }
      case "assess_readiness": {
        const r = assess(readinessInput(profile));
        return done({ disclaimer: "Illustrative. Not a credit decision or offer.", score: r.score, path: r.pathLabel, illustrative_limit: r.limit, safe_to_send: r.safeToSend, runway_months: Math.round(r.runwayMonths * 10) / 10, next_unlock: r.nextUnlock, premium_eta: r.premiumEta, readiness: r.readiness, reasons: r.reasons.map((x) => x.text), as_of: new Date().toISOString(), source: "user_stated" });
      }
    }
    return done(`Unknown tool ${name}`, false);
  } catch (e) {
    return done(`Tool failed: ${e instanceof Error ? e.message : String(e)}`, false);
  }
}

const pr = (p: Progress) => ({ kind: p.kind, note: p.note, at: p.created_at });
const mem = (m: Memory) => ({ kind: m.kind, summary: m.summary, confidence: m.confidence, at: m.created_at });
