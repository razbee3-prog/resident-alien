import "server-only";
import { buildPacket, renderPacket } from "./context";
import { agentLoop } from "./llm";
import { outboundProblems } from "./policy";
import * as store from "./store";
import type { CoachUser, MessagingProvider } from "./types";

const NO_MESSAGE = "NO_MESSAGE";

/**
 * Weekly check-in. No new user message: the agent reviews the plan, closes/sets the weekly task, versions the plan
 * on a material change, and sends one short message or deliberately nothing.
 */
export async function runWeeklyCheckin(user: CoachUser, provider: MessagingProvider): Promise<{ sent: boolean; text: string | null; runId: string }> {
  const t0 = Date.now();
  const runId = crypto.randomUUID();
  const conv = await store.getConversation(user.id);
  const recent = await store.recentMessages(user.id, 8);
  const packet = await buildPacket(user, conv, recent);
  const instruction = [
    "WEEKLY CHECK-IN. There is no new message from the user; you are initiating.",
    "1. If this week's task is done or the user reported it done, call complete_task. If it is overdue with no progress, call complete_task(skipped) and pick something smaller.",
    "2. If a replan_if condition is met (see memories and progress), call create_plan_version with a rationale that names the change.",
    "3. Call set_weekly_task with the one safest highest-value action for the coming week, unless the current task is still valid and not overdue.",
    `4. Then write ONE short message (under 300 characters): this week's action, the why in one clause, and a light question or "reply DONE when it's set". If nothing meaningful changed and the current task is still valid and not overdue, reply with exactly ${NO_MESSAGE}.`,
  ].join("\n");
  const userTurn = `${renderPacket(packet, "")}\n\n${instruction}`;

  const loop = await agentLoop({ user, skills: ["plan_and_goals"], userTurn });
  let text: string | null = loop.text.trim();
  if (!text || text.toUpperCase().includes(NO_MESSAGE) || outboundProblems(text).length) text = null;

  if (text) {
    const receipts = await provider.send(user.phone, text);
    await store.insertOutbound({ user_id: user.id, handle: receipts[0]?.handle ?? null, content: text, status: receipts[0]?.status ?? "SENT", run_id: runId });
  }
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + 7);
  if (typeof user.checkin_weekday === "number") {
    while (next.getUTCDay() !== user.checkin_weekday) next.setUTCDate(next.getUTCDate() + 1);
  }
  await store.updateUser(user.id, { next_checkin_at: next.toISOString() });
  await store.insertRun({ id: runId, user_id: user.id, trigger: "weekly", intent: "weekly_checkin", skills: ["plan_and_goals"], packet, tool_calls: loop.log, model: loop.model, usage: loop.usage, policy: null, response: text, error: loop.refused ? "refusal" : null, duration_ms: Date.now() - t0 });
  return { sent: Boolean(text), text, runId };
}
