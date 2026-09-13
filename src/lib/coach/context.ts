import "server-only";
import { effectiveStage } from "./onboarding";
import * as store from "./store";
import { daysBetween } from "./text";
import type { CoachUser, Connection, Conversation, CreditSnapshot, Goal, Memory, Message, Plan, Progress, Task } from "./types";

/**
 * The context packet: assembled fresh every turn, intentionally small, and inspectable in coach_runs.packet.
 * The goal header is the anchoring mechanism; it leads every packet.
 */
export type Packet = {
  now: string;
  stage: CoachUser["onboarding_stage"];
  goal: Pick<Goal, "outcome_type" | "description" | "score_target" | "target_date"> | null;
  days_left: number | null;
  plan: { version: number; milestone: string | null; rationale: string } | null;
  task: { id: string; title: string; status: Task["status"]; due_in_days: number | null; success_condition: string } | null;
  nudge: boolean;
  score: { score: number | null; model: string | null; bureau: string | null; as_of: string | null; source: string; recorded: string } | null;
  connection: Connection["status"] | null;
  profile: CoachUser["profile"];
  memories: string[];
  summary: string;
  progress: string[];
  recent: { role: "user" | "assistant"; text: string; at: string }[];
};

export async function buildPacket(user: CoachUser, conv: Conversation, recent: Message[]): Promise<Packet> {
  const [goal, plan, task, memories, progress, snaps, connection] = await Promise.all([
    store.getActiveGoal(user.id),
    store.getActivePlan(user.id),
    store.getActiveTask(user.id),
    store.listMemories(user.id, 12),
    store.recentProgress(user.id, 4),
    store.listSnapshots(user.id, 1),
    store.getConnection(user.id),
  ]);
  const latest: CreditSnapshot | undefined = snaps[0];
  const now = new Date().toISOString();
  return {
    now,
    stage: effectiveStage(user),
    goal: goal ? { outcome_type: goal.outcome_type, description: goal.description, score_target: goal.score_target, target_date: goal.target_date } : null,
    days_left: goal?.target_date ? daysBetween(now, `${goal.target_date}T00:00:00Z`) : null,
    plan: plan ? { version: plan.version, milestone: activeMilestone(plan), rationale: plan.rationale } : null,
    task: task ? { id: task.id, title: task.title, status: task.status, due_in_days: task.due_at ? daysBetween(now, task.due_at) : null, success_condition: task.success_condition } : null,
    nudge: conv.nudge,
    score: latest ? { score: latest.score, model: latest.score_model, bureau: latest.bureau, as_of: latest.as_of, source: latest.source, recorded: latest.created_at.slice(0, 10) } : null,
    connection: connection?.status ?? null,
    profile: user.profile,
    memories: memories.map(memLine),
    summary: conv.summary,
    progress: progress.map((p: Progress) => `${p.created_at.slice(0, 10)} ${p.kind}: ${p.note}`),
    recent: recent.map((m) => ({ role: m.direction === "in" ? "user" : "assistant", text: m.content, at: m.created_at })),
  };
}

function activeMilestone(plan: Plan): string | null {
  return plan.milestones.find((m) => m.status === "active")?.outcome ?? plan.milestones.find((m) => m.status === "pending")?.outcome ?? null;
}

function memLine(m: Memory): string {
  return `${m.summary} (${m.kind}, ${m.confidence}, ${m.created_at.slice(0, 10)})`;
}

/** Render the packet as the text that precedes the user's new messages in the user turn. */
export function renderPacket(p: Packet, stageInstruction: string): string {
  const lines: string[] = [];
  lines.push(`[now: ${p.now.slice(0, 16)}Z]`);
  lines.push("GOAL HEADER");
  if (p.goal) {
    lines.push(`Goal: ${p.goal.description} (${p.goal.outcome_type}${p.goal.score_target ? `, score target ${p.goal.score_target}` : ""})${p.goal.target_date ? ` · target ${p.goal.target_date}${p.days_left !== null ? ` · ${p.days_left} days left` : ""}` : ""}`);
  } else lines.push("Goal: not set yet");
  if (p.plan) lines.push(`Plan v${p.plan.version} · active milestone: ${p.plan.milestone ?? "none"}`);
  if (p.task) lines.push(`This week: ${p.task.title} · ${p.task.status}${p.task.due_in_days !== null ? ` · due in ${p.task.due_in_days} day${p.task.due_in_days === 1 ? "" : "s"}` : ""} · done when: ${p.task.success_condition}`);
  else if (p.stage === "active") lines.push("This week: no active task (set one)");
  if (p.score) lines.push(`Score on file: ${p.score.score ?? "unreadable"}${p.score.model ? ` ${p.score.model}` : ""}${p.score.bureau ? `, ${p.score.bureau}` : ""}${p.score.as_of ? `, as of ${p.score.as_of}` : ""} (via ${p.score.source.replace(/_/g, " ")}, read ${p.score.recorded})`);
  else lines.push(`Score on file: none${p.connection ? ` · Credit Karma connection: ${p.connection}` : ""}`);
  if (p.connection === "needs_relogin") lines.push("Credit Karma session expired; offer request_credit_link when relevant.");
  if (p.nudge) lines.push("NUDGE: the last few turns drifted from this week's action; steer back gently in this reply.");
  lines.push("");
  lines.push(`Onboarding stage: ${p.stage}`);
  if (stageInstruction) lines.push(`Stage instruction: ${stageInstruction}`);
  lines.push("");
  // Bookkeeping keys (stage_hint, pending_followup) are for the code, not the coach.
  const prof = Object.entries(p.profile).filter(([k, v]) => v !== undefined && v !== null && typeof v !== "object" && k !== "stage_hint");
  lines.push(`Profile: ${prof.length ? prof.map(([k, v]) => `${k}=${v}`).join(", ") : "empty"}`);
  if (p.memories.length) lines.push(`Memories:\n${p.memories.map((m) => `- ${m}`).join("\n")}`);
  if (p.progress.length) lines.push(`Recent progress:\n${p.progress.map((m) => `- ${m}`).join("\n")}`);
  if (p.summary) lines.push(`Conversation so far: ${p.summary}`);
  if (p.recent.length) lines.push(`Recent messages:\n${p.recent.map((m) => `${m.role === "user" ? "User" : "You"} (${m.at.slice(5, 16)}): ${m.text}`).join("\n")}`);
  return lines.join("\n");
}
