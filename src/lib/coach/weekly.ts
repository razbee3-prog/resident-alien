import "server-only";
import { browserEnabled } from "./browser-flag";
import { buildPacket, renderPacket } from "./context";
import { connectedNote, scoreDelta, scoreLine } from "./score-page";
import { site } from "@/lib/site";
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
  const scoreUpdate = (await readThroughConnection(user))?.line ?? null;
  const conv = await store.getConversation(user.id);
  const recent = await store.recentMessages(user.id, 8);
  const packet = await buildPacket(user, conv, recent);
  const instruction = [
    "WEEKLY CHECK-IN. There is no new message from the user; you are initiating.",
    "1. If this week's task is done or the user reported it done, call complete_task. If it is overdue with no progress, call complete_task(skipped) and pick something smaller.",
    "2. If a replan_if condition is met (see memories and progress), call create_plan_version with a rationale that names the change.",
    "3. Call set_weekly_task with the one safest highest-value action for the coming week, unless the current task is still valid and not overdue.",
    `4. Then write ONE short message (under 300 characters): this week's action, the why in one clause, and a light question or "reply DONE when it's set". If a SCORE UPDATE below is marked material, lead with it in one clause (score, model, date). If it says the Credit Karma session expired, include the link and ask them to open it on their phone or laptop. If there is no connection and the score on file is missing or older than 30 days, you may ask for a fresh screenshot of their score card instead of a separate action, but keep the message to one ask. If nothing meaningful changed and the current task is still valid and not overdue, reply with exactly ${NO_MESSAGE}.`,
  ].join("\n");
  const userTurn = `${renderPacket(packet, "")}\n\n${scoreUpdate ? `SCORE UPDATE: ${scoreUpdate}\n\n` : ""}${instruction}`;

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

export type ConnectionRead =
  | { kind: "fresh"; line: string; note: string; score: number | null; previous: number | null; material: boolean }
  | { kind: "relogin"; line: string; linkUrl: string };

/**
 * Re-read the score through the stored Credit Karma session and record a snapshot. `line` is the one-line form for a
 * prompt; `note` is the fuller read the coach presents from. Null when there is nothing to read through. Never throws.
 * `allowPending` also tries a connection whose link was opened but never completed (the user logged in; the read failed).
 */
export async function readThroughConnection(user: CoachUser, opts: { timeoutMs?: number; relinkTtlMinutes?: number; allowPending?: boolean } = {}): Promise<ConnectionRead | null> {
  if (!browserEnabled) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const conn = await store.getConnection(user.id);
    if (!conn || !conn.context_id) return null;
    if (conn.status !== "active" && !(opts.allowPending && conn.status === "pending")) return null;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("refresh timed out")), opts.timeoutMs ?? 90_000);
    });
    const { refreshConnection } = await import("./browser");
    const read = await Promise.race([refreshConnection(conn.context_id), timeout]);
    if (!read.loggedIn) {
      if (conn.status === "active") await store.updateConnection(conn.id, { status: "needs_relogin", last_error: read.reason ?? read.extraction?.notes ?? "login page" });
      const ttl = opts.relinkTtlMinutes ?? 60 * 24;
      const link = await store.issueLinkToken(user.id, conn.id, ttl);
      const linkUrl = `${site.url}/connect/${link.token}`;
      return { kind: "relogin", linkUrl, line: `Credit Karma session expired; not material by itself. New link (phone or laptop, valid ${ttl >= 60 ? `${Math.round(ttl / 60)} h` : `${ttl} min`}): ${linkUrl}` };
    }
    const x = read.extraction!;
    const previous = (await store.listSnapshots(user.id, 1))[0] ?? null;
    await store.insertSnapshot(user.id, { source: "credit_karma_browser", score: x.score, score_model: x.score_model, bureau: x.bureau, as_of: x.as_of, confidence: x.confidence, extract: x });
    await store.updateConnection(conn.id, { status: "active", last_ok_at: new Date().toISOString(), last_error: null });
    const { delta, material } = scoreDelta(x.score, previous?.score ?? null);
    const line = `score ${scoreLine(x)}; previous ${previous?.score ?? "none"}${delta !== null ? ` (${delta >= 0 ? "+" : ""}${delta})` : ""}; ${material ? "MATERIAL" : "not material"}`;
    return { kind: "fresh", line, note: connectedNote(x), score: x.score, previous: previous?.score ?? null, material };
  } catch (e) {
    console.warn("score refresh failed", e);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
