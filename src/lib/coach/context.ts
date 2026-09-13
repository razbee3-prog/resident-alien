import "server-only";
import * as store from "./store";
import { daysBetween } from "./text";
import type { CoachUser, Conversation, Goal, Memory, Message, Plan, Progress, Task } from "./types";

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
  profile: CoachUser["profile"];
  memories: string[];
  summary: string;
  progress: string[];
  recent: { role: "user" | "assistant"; text: string; at: string }[];
};

export async function buildPacket(user: CoachUser, conv: Conversation, recent: Message[]): Promise<Packet> {
  const [goal, plan, task, memories, progress] = await Promise.all([
    store.getActiveGoal(user.id),
    store.getActivePlan(user.id),
    store.getActiveTask(user.id),
    store.listMemories(user.id, 12),
    store.recentProgress(user.id, 4),
  ]);
  const now = new Date().toISOString();
  return {
    now,
    stage: user.onboarding_stage,
    goal: goal ? { outcome_type: goal.outcome_type, description: goal.description, score_target: goal.score_target, target_date: goal.target_date } : null,
    days_left: goal?.target_date ? daysBetween(now, `${goal.target_date}T00:00:00Z`) : null,
    plan: plan ? { version: plan.version, milestone: activeMilestone(plan), rationale: plan.rationale } : null,
    task: task ? { id: task.id, title: task.title, status: task.status, due_in_days: task.due_at ? daysBetween(now, task.due_at) : null, success_condition: task.success_condition } : null,
    nudge: conv.nudge,
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
  if (p.nudge) lines.push("NUDGE: the last few turns drifted from this week's action; steer back gently in this reply.");
  lines.push("");
  lines.push(`Onboarding stage: ${p.stage}`);
  if (stageInstruction) lines.push(`Stage instruction: ${stageInstruction}`);
  lines.push("");
  const prof = Object.entries(p.profile).filter(([, v]) => v !== undefined && v !== null);
  lines.push(`Profile: ${prof.length ? prof.map(([k, v]) => `${k}=${v}`).join(", ") : "empty"}`);
  if (p.memories.length) lines.push(`Memories:\n${p.memories.map((m) => `- ${m}`).join("\n")}`);
  if (p.progress.length) lines.push(`Recent progress:\n${p.progress.map((m) => `- ${m}`).join("\n")}`);
  if (p.summary) lines.push(`Conversation so far: ${p.summary}`);
  if (p.recent.length) lines.push(`Recent messages:\n${p.recent.map((m) => `${m.role === "user" ? "User" : "You"} (${m.at.slice(5, 16)}): ${m.text}`).join("\n")}`);
  return lines.join("\n");
}
