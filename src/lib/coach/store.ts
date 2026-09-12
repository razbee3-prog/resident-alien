import "server-only";
import { db } from "./db";
import type { CoachEvent, CoachUser, Conversation, Goal, Job, Memory, Message, Plan, Progress, Run, Task } from "./types";

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

/* -------------------------------- users -------------------------------- */

export async function getUser(id: string): Promise<CoachUser | null> {
  return (await db.select<CoachUser>("coach_users", { eq: { id }, limit: 1 }))[0] ?? null;
}

export async function getUserByPhone(phone: string): Promise<CoachUser | null> {
  return (await db.select<CoachUser>("coach_users", { eq: { phone }, limit: 1 }))[0] ?? null;
}

export async function ensureUser(phone: string): Promise<CoachUser> {
  const existing = await getUserByPhone(phone);
  if (existing) return existing;
  const row: CoachUser = {
    id: uuid(),
    phone,
    segment: null,
    country: null,
    persona: null,
    timezone: null,
    onboarding_stage: "new",
    opted_out: false,
    consent_messaging_at: null,
    checkin_weekday: null,
    next_checkin_at: null,
    profile: {},
    created_at: now(),
    updated_at: now(),
  };
  const inserted = await db.insert("coach_users", row);
  if (!inserted) return (await getUserByPhone(phone))!;
  await db.insert("coach_conversations", emptyConversation(row.id));
  return inserted;
}

export async function updateUser(id: string, patch: Partial<CoachUser>): Promise<CoachUser> {
  const rows = await db.update<CoachUser>("coach_users", { id }, { ...patch, updated_at: now() });
  return rows[0];
}

export async function listActiveUsers(): Promise<CoachUser[]> {
  return db.select<CoachUser>("coach_users", { eq: { onboarding_stage: "active", opted_out: false } });
}

/* ----------------------------- conversation ----------------------------- */

function emptyConversation(user_id: string): Conversation {
  return { user_id, summary: "", summary_through: null, lock_until: null, turn_count: 0, off_track_streak: 0, nudge: false, last_in_at: null, last_out_at: null };
}

export async function getConversation(userId: string): Promise<Conversation> {
  const found = (await db.select<Conversation>("coach_conversations", { eq: { user_id: userId }, limit: 1 }))[0];
  if (found) return found;
  const row = emptyConversation(userId);
  return (await db.insert("coach_conversations", row)) ?? row;
}

export async function updateConversation(userId: string, patch: Partial<Conversation>): Promise<void> {
  await db.update<Conversation>("coach_conversations", { user_id: userId }, patch);
}

export async function acquireTurnLock(userId: string, ttlMs = 90_000): Promise<boolean> {
  await getConversation(userId);
  return db.acquireLock(userId, new Date(Date.now() + ttlMs).toISOString());
}

export async function releaseTurnLock(userId: string): Promise<void> {
  await db.update<Conversation>("coach_conversations", { user_id: userId }, { lock_until: null });
}

/* -------------------------------- messages ------------------------------ */

export async function insertInbound(input: { user_id: string; handle: string; content: string; service: string | null; status: string | null; payload: Record<string, unknown> | null }): Promise<Message | null> {
  const row: Message = {
    id: uuid(),
    user_id: input.user_id,
    direction: "in",
    message_handle: input.handle,
    content: input.content,
    service: input.service,
    status: input.status,
    payload: input.payload,
    created_at: now(),
    processed_at: null,
    run_id: null,
  };
  const inserted = await db.insert("coach_messages", row);
  if (inserted) await updateConversation(input.user_id, { last_in_at: row.created_at });
  return inserted;
}

export async function insertOutbound(input: { user_id: string; handle: string | null; content: string; status: string; run_id: string | null }): Promise<Message> {
  const row: Message = {
    id: uuid(),
    user_id: input.user_id,
    direction: "out",
    message_handle: input.handle,
    content: input.content,
    service: null,
    status: input.status,
    payload: null,
    created_at: now(),
    processed_at: now(),
    run_id: input.run_id,
  };
  await db.insert("coach_messages", row);
  await updateConversation(input.user_id, { last_out_at: row.created_at });
  return row;
}

export async function listUnprocessed(userId: string): Promise<Message[]> {
  return db.select<Message>("coach_messages", { eq: { user_id: userId, direction: "in" }, isNull: ["processed_at"], order: { col: "created_at", asc: true } });
}

export async function markProcessed(ids: string[], runId: string): Promise<void> {
  for (const id of ids) await db.update<Message>("coach_messages", { id }, { processed_at: now(), run_id: runId });
}

export async function recentMessages(userId: string, limit = 12): Promise<Message[]> {
  const rows = await db.select<Message>("coach_messages", { eq: { user_id: userId }, order: { col: "created_at", asc: false }, limit });
  return rows.reverse();
}

export async function updateDeliveryStatus(handle: string, status: string): Promise<void> {
  await db.update<Message>("coach_messages", { message_handle: handle }, { status });
}

/* ----------------------------- goals / plans ---------------------------- */

export async function getActiveGoal(userId: string): Promise<Goal | null> {
  return (await db.select<Goal>("coach_goals", { eq: { user_id: userId, status: "active" }, order: { col: "created_at", asc: false }, limit: 1 }))[0] ?? null;
}

export async function setGoal(userId: string, input: { outcome_type: string; description: string; score_target: number | null; target_date: string | null }): Promise<Goal> {
  await db.update<Goal>("coach_goals", { user_id: userId, status: "active" }, { status: "abandoned" });
  const row: Goal = { id: uuid(), user_id: userId, ...input, status: "active", created_at: now() };
  await db.insert("coach_goals", row);
  return row;
}

export async function getActivePlan(userId: string): Promise<Plan | null> {
  return (await db.select<Plan>("coach_plans", { eq: { user_id: userId, status: "active" }, order: { col: "version", asc: false }, limit: 1 }))[0] ?? null;
}

export async function createPlanVersion(userId: string, input: { goal_id: string | null; rationale: string; milestones: Plan["milestones"]; replan_if: string[]; assumptions: Record<string, unknown> }): Promise<Plan> {
  const all = await db.select<Plan>("coach_plans", { eq: { user_id: userId }, order: { col: "version", asc: false }, limit: 1 });
  const version = (all[0]?.version ?? 0) + 1;
  await db.update<Plan>("coach_plans", { user_id: userId, status: "active" }, { status: "superseded", superseded_at: now() });
  const row: Plan = { id: uuid(), user_id: userId, version, status: "active", created_at: now(), superseded_at: null, ...input };
  const inserted = await db.insert("coach_plans", row);
  if (!inserted) return createPlanVersion(userId, input);
  return row;
}

export async function getActiveTask(userId: string): Promise<Task | null> {
  return (await db.select<Task>("coach_tasks", { eq: { user_id: userId, status: "active" }, order: { col: "created_at", asc: false }, limit: 1 }))[0] ?? null;
}

export async function setWeeklyTask(userId: string, input: { plan_id: string | null; title: string; rationale: string; action_type: string; success_condition: string; due_at: string | null }): Promise<Task> {
  await db.update<Task>("coach_tasks", { user_id: userId, status: "active" }, { status: "expired" });
  const row: Task = { id: uuid(), user_id: userId, status: "active", completed_at: null, created_at: now(), ...input };
  await db.insert("coach_tasks", row);
  return row;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  return (await db.update<Task>("coach_tasks", { id }, patch))[0] ?? null;
}

/* -------------------------------- memories ------------------------------ */

export async function listMemories(userId: string, limit = 12): Promise<Memory[]> {
  const rows = await db.select<Memory>("coach_memories", { eq: { user_id: userId }, isNull: ["superseded_by"], order: { col: "created_at", asc: false }, limit: limit * 2 });
  const t = Date.now();
  return rows.filter((m) => !m.expires_at || new Date(m.expires_at).getTime() > t).slice(0, limit);
}

export async function insertMemory(userId: string, input: { kind: Memory["kind"]; summary: string; source: Memory["source"]; confidence: Memory["confidence"]; expires_at: string | null; supersedes?: string | null }): Promise<Memory> {
  const row: Memory = { id: uuid(), user_id: userId, kind: input.kind, summary: input.summary, source: input.source, confidence: input.confidence, superseded_by: null, expires_at: input.expires_at, created_at: now() };
  await db.insert("coach_memories", row);
  if (input.supersedes) await db.update<Memory>("coach_memories", { id: input.supersedes, user_id: userId }, { superseded_by: row.id });
  return row;
}

/* -------------------------------- progress ------------------------------ */

export async function insertProgress(userId: string, input: { task_id: string | null; kind: Progress["kind"]; note: string }): Promise<Progress> {
  const row: Progress = { id: uuid(), user_id: userId, created_at: now(), ...input };
  await db.insert("coach_progress", row);
  return row;
}

export async function recentProgress(userId: string, limit = 5): Promise<Progress[]> {
  return db.select<Progress>("coach_progress", { eq: { user_id: userId }, order: { col: "created_at", asc: false }, limit });
}

/* ---------------------------------- runs -------------------------------- */

export async function insertRun(run: Omit<Run, "id" | "created_at"> & { id?: string }): Promise<Run> {
  const row: Run = { id: run.id ?? uuid(), created_at: now(), ...run };
  await db.insert("coach_runs", row);
  return row;
}

/* ---------------------------------- jobs -------------------------------- */

/** One job per user/kind/day. Returns null if already claimed (Vercel may double-fire). */
export async function claimJob(userId: string, kind: Job["kind"], runDate: string): Promise<Job | null> {
  const row: Job = { id: uuid(), user_id: userId, kind, run_date: runDate, run_at: now(), status: "running", locked_until: new Date(Date.now() + 5 * 60_000).toISOString(), result: null, created_at: now() };
  return db.insert("coach_jobs", row);
}

export async function finishJob(id: string, status: "done" | "failed", result: unknown): Promise<void> {
  await db.update<Job>("coach_jobs", { id }, { status, result, locked_until: null });
}

/* --------------------------------- events ------------------------------- */

export async function insertEvent(userId: string | null, kind: CoachEvent["kind"], detail: unknown): Promise<void> {
  const row: CoachEvent = { id: uuid(), user_id: userId, kind, detail, created_at: now() };
  await db.insert("coach_events", row);
}
