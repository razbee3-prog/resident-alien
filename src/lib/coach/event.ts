import "server-only";
import { buildPacket, renderPacket } from "./context";
import { agentLoop } from "./llm";
import { effectiveStage } from "./onboarding";
import { OUTBOUND_FALLBACK, outboundProblems } from "./policy";
import { sendblueProvider } from "./sendblue";
import type { SkillName } from "./skills";
import * as store from "./store";
import type { CoachUser, MessagingProvider, OnboardingStage } from "./types";

/**
 * A coach-initiated turn with no inbound message: something happened (a Credit Karma read landed) and the coach
 * should speak. Same loop, guard, and recording as an inbound turn; stage advances if a plan and task were created.
 */
export async function runEventTurn(
  userId: string,
  input: { trigger: "inbound" | "weekly" | "daily" | "simulate"; intent: string; skills: SkillName[]; notes: string[]; instruction: string; provider?: MessagingProvider },
): Promise<{ sent: boolean; text: string | null; runId: string }> {
  const t0 = Date.now();
  const runId = crypto.randomUUID();
  const provider = input.provider ?? sendblueProvider;
  let user = (await store.getUser(userId))!;
  if (!(await store.acquireTurnLock(userId, 120_000))) {
    // Another turn is running; wait briefly for it and try once more so the event isn't lost.
    await new Promise((r) => setTimeout(r, 4000));
    if (!(await store.acquireTurnLock(userId, 120_000))) throw new Error("user is busy in another turn");
  }
  try {
    const conv = await store.getConversation(userId);
    const recent = await store.recentMessages(userId, 10);
    const packet = await buildPacket(user, conv, recent);
    const userTurn = [renderPacket(packet, ""), input.notes.length ? `Notes:\n${input.notes.map((n) => `- ${n}`).join("\n")}` : "", input.instruction].filter(Boolean).join("\n\n");
    const loop = await agentLoop({ user, skills: input.skills, userTurn });

    let reply = loop.text.trim();
    const problems = outboundProblems(reply);
    if (problems.length) {
      try {
        const rewrite = await agentLoop({ user, skills: input.skills, userTurn: `${userTurn}\n\nYOUR DRAFT REPLY WAS REJECTED by the policy guard for these phrases: ${problems.join("; ")}. Rewrite it without promises or guarantees, same meaning, same length. Reply with the rewritten text only, no tool calls.` });
        reply = outboundProblems(rewrite.text).length ? OUTBOUND_FALLBACK : rewrite.text;
      } catch {
        reply = OUTBOUND_FALLBACK;
      }
    }

    const fx = loop.effects;
    const stage = effectiveStage(user);
    let nextStage: OnboardingStage = stage;
    if (stage !== "active" && fx.planCreated && fx.taskSet) nextStage = "active";
    if (nextStage !== stage || fx.taskSet) {
      const patch: Partial<CoachUser> = {};
      if (fx.taskSet) patch.next_checkin_at = new Date(Math.min(new Date(fx.taskSet.due_at ?? Date.now() + 7 * 86400000).getTime(), Date.now() + 7 * 86400000)).toISOString();
      else if (nextStage === "active" && !user.next_checkin_at) patch.next_checkin_at = new Date(Date.now() + 7 * 86400000).toISOString();
      user = await store.setStage({ ...user, profile: fx.profile ?? user.profile }, nextStage, patch);
    }

    let sent = false;
    if (reply && !user.opted_out) {
      try {
        const receipts = await provider.send(user.phone, reply);
        await store.insertOutbound({ user_id: userId, handle: receipts[0]?.handle ?? null, content: reply, status: receipts[0]?.status ?? "SENT", run_id: runId });
        sent = true;
      } catch (e) {
        console.error("event turn send failed", e);
        await store.insertEvent(userId, "delivery_error", { run_id: runId, error: String(e) }).catch(() => {});
      }
    }
    await store.insertRun({ id: runId, user_id: userId, trigger: input.trigger, intent: input.intent, skills: input.skills, packet, tool_calls: loop.log, model: loop.model, usage: loop.usage, policy: { problems }, response: reply || null, error: loop.refused ? "refusal" : null, duration_ms: Date.now() - t0 });
    return { sent, text: reply || null, runId };
  } finally {
    await store.releaseTurnLock(userId);
  }
}
