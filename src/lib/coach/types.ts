import type { Segment } from "@/lib/segments";

export type OnboardingStage = "new" | "consent" | "goal" | "context" | "active";

/** Durable, structured facts. Never store SSNs, card numbers, passport or account numbers here. */
export type Profile = {
  name?: string;
  segment?: Segment;
  country?: string; // ISO-3
  persona?: string; // f1_student | opt_worker | h1b_worker | other
  arrival?: string; // YYYY-MM
  income_started?: boolean;
  days_to_start?: number;
  annual_income?: number;
  savings?: number;
  rent?: number;
  essentials?: number;
  remittance_monthly?: number;
  emergency_reserve?: number;
  next_income_date?: string;
  has_ssn?: boolean;
  has_us_bank?: boolean;
  has_credit_account?: boolean;
  credit_limit?: number;
  current_balance?: number;
  statement_balance?: number;
  minimum_payment?: number;
  payment_due_day?: number;
  statement_close_day?: number;
  autopay?: boolean;
  foreign_credit?: boolean;
  preferred_checkin?: string;
};

export type CoachUser = {
  id: string;
  phone: string;
  segment: Segment | null;
  country: string | null;
  persona: string | null;
  timezone: string | null;
  onboarding_stage: OnboardingStage;
  opted_out: boolean;
  consent_messaging_at: string | null;
  checkin_weekday: number | null;
  next_checkin_at: string | null;
  profile: Profile;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  user_id: string;
  summary: string;
  summary_through: string | null;
  lock_until: string | null;
  turn_count: number;
  off_track_streak: number;
  nudge: boolean;
  last_in_at: string | null;
  last_out_at: string | null;
};

export type Message = {
  id: string;
  user_id: string;
  direction: "in" | "out";
  message_handle: string | null;
  content: string;
  service: string | null;
  status: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  processed_at: string | null;
  run_id: string | null;
};

export type Goal = {
  id: string;
  user_id: string;
  outcome_type: string;
  description: string;
  score_target: number | null;
  target_date: string | null;
  status: "active" | "achieved" | "abandoned";
  created_at: string;
};

export type Milestone = { id: string; outcome: string; status: "pending" | "active" | "complete" };

export type Plan = {
  id: string;
  user_id: string;
  goal_id: string | null;
  version: number;
  status: "active" | "superseded";
  rationale: string;
  milestones: Milestone[];
  replan_if: string[];
  assumptions: Record<string, unknown>;
  created_at: string;
  superseded_at: string | null;
};

export type Task = {
  id: string;
  plan_id: string | null;
  user_id: string;
  title: string;
  rationale: string;
  action_type: string;
  success_condition: string;
  status: "active" | "done" | "skipped" | "expired";
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  kind: "preference" | "constraint" | "fact" | "event";
  summary: string;
  source: "user_stated" | "inferred" | "system";
  confidence: "high" | "medium" | "low";
  superseded_by: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Progress = {
  id: string;
  user_id: string;
  task_id: string | null;
  kind: "advance" | "neutral" | "off_track" | "complete" | "nudge";
  note: string;
  created_at: string;
};

export type Run = {
  id: string;
  user_id: string;
  trigger: "inbound" | "weekly" | "daily" | "simulate";
  intent: string | null;
  skills: string[];
  packet: unknown;
  tool_calls: unknown;
  model: string | null;
  usage: unknown;
  policy: unknown;
  response: string | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
};

export type Job = {
  id: string;
  user_id: string;
  kind: "daily_monitor" | "weekly_checkin";
  run_date: string;
  run_at: string;
  status: "running" | "done" | "failed";
  locked_until: string | null;
  result: unknown;
  created_at: string;
};

export type CoachEvent = {
  id: string;
  user_id: string | null;
  kind: "pii_detected" | "opt_out" | "escalation" | "monitor_finding" | "delivery_error";
  detail: unknown;
  created_at: string;
};

export type DeliveryReceipt = { handle: string | null; status: string; dryRun: boolean };

export interface MessagingProvider {
  send(to: string, text: string): Promise<DeliveryReceipt[]>;
  typing(to: string): Promise<void>;
  markRead(to: string): Promise<void>;
}

export type Connection = {
  id: string;
  user_id: string;
  provider: "credit_karma";
  context_id: string | null;
  status: "pending" | "active" | "needs_relogin" | "revoked";
  last_ok_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkToken = {
  token: string;
  user_id: string;
  connection_id: string | null;
  session_id: string | null;
  connect_url: string | null;
  live_view_url: string | null;
  device: "laptop" | "phone" | null;
  status: "issued" | "opened" | "completed" | "expired";
  expires_at: string;
  created_at: string;
};

export type CreditSnapshot = {
  id: string;
  user_id: string;
  source: string;
  score: number | null;
  score_model: string | null;
  bureau: string | null;
  as_of: string | null;
  confidence: string | null;
  extract: unknown;
  created_at: string;
};
