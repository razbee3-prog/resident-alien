import { NextResponse } from "next/server";
import { coachAvailable } from "@/lib/coach/db";
import { runEventTurn } from "@/lib/coach/event";
import { ingestInbound } from "@/lib/coach/ingest";
import { connectedInstruction, effectiveStage } from "@/lib/coach/onboarding";
import * as store from "@/lib/coach/store";
import { normalizePhone } from "@/lib/coach/text";
import { runTurn } from "@/lib/coach/turn";
import type { MessagingProvider } from "@/lib/coach/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Dev-only harness: POST { phone, text } runs the full pipeline (ingest → turn → memory) with a capturing
 * provider and returns the reply plus the user's state. 404 in production unless COACH_SIMULATE=1.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.COACH_SIMULATE !== "1") return NextResponse.json({ ok: false }, { status: 404 });
  if (!coachAvailable) return NextResponse.json({ ok: false, error: "coach not configured" }, { status: 503 });

  let body: { phone?: string; text?: string; mediaUrl?: string; event?: "connected"; score?: number };
  try {
    body = (await req.json()) as { phone?: string; text?: string; mediaUrl?: string; event?: "connected"; score?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON." }, { status: 400 });
  }
  const phone = normalizePhone(String(body.phone ?? ""));
  const text = String(body.text ?? "");
  if (!phone) return NextResponse.json({ ok: false, error: "phone must be E.164" }, { status: 400 });

  const sent: string[] = [];
  const provider: MessagingProvider = {
    async send(_to, t) {
      sent.push(t);
      return [{ handle: `sim_${crypto.randomUUID()}`, status: "SIMULATED", dryRun: true }];
    },
    async typing() {},
    async markRead() {},
  };

  if (body.event === "connected") {
    const u = await store.ensureUser(phone);
    const score = typeof body.score === "number" ? body.score : 612;
    await store.insertSnapshot(u.id, { source: "credit_karma_browser", score, score_model: "VantageScore 3.0", bureau: "TransUnion", as_of: new Date().toISOString().slice(0, 10), confidence: "high", extract: { observations: "One secured card, $500 limit, 8% utilization, 100% on-time, no derogatory marks, file age 1 month." } });
    const conn = await store.ensureConnection(u.id);
    await store.updateConnection(conn.id, { status: "active", last_ok_at: new Date().toISOString() });
    const r = await runEventTurn(u.id, { trigger: "simulate", intent: "credit_karma_connected", skills: ["onboarding", "plan_and_goals", "credit_coach"], notes: [`Credit Karma read just now: score ${score} VantageScore 3.0, TransUnion, as of today (confidence high). Utilization 8%, on-time 100%, accounts 1, derogatory 0. Observations: One secured card with a $500 limit, opened last month; no alerts. A snapshot was recorded; the connection is active and will be re-read weekly.`], instruction: connectedInstruction(), provider });
    const [user2, plan2, task2] = await Promise.all([store.getUser(u.id), store.getActivePlan(u.id), store.getActiveTask(u.id)]);
    return NextResponse.json({ ok: true, action: "event", replies: sent, results: [{ runId: r.runId, stage: user2 ? effectiveStage(user2) : null, error: null }], state: { stage: user2 ? effectiveStage(user2) : null, plan: plan2 && { version: plan2.version, milestones: plan2.milestones }, task: task2 } });
  }

  const r = await ingestInbound({ from: phone, handle: `sim_${crypto.randomUUID()}`, content: text, service: "iMessage", status: "RECEIVED", optedOut: false, mediaUrl: typeof body.mediaUrl === "string" ? body.mediaUrl : null, dateSent: new Date().toISOString() });
  const results = r.action === "queued" ? await runTurn(r.user.id, { provider, trigger: "simulate", debounceMs: 0 }) : [];

  const [user, goal, plan, task, memories, conv, progress] = await Promise.all([
    store.getUser(r.user.id),
    store.getActiveGoal(r.user.id),
    store.getActivePlan(r.user.id),
    store.getActiveTask(r.user.id),
    store.listMemories(r.user.id, 12),
    store.getConversation(r.user.id),
    store.recentProgress(r.user.id, 5),
  ]);
  return NextResponse.json({
    ok: true,
    action: r.action,
    replies: sent,
    results: results.map((x) => ({ runId: x.runId, stage: x.stage, skills: x.skills, intent: x.intent, error: x.error })),
    state: {
      stage: user ? effectiveStage(user) : null,
      opted_out: user?.opted_out,
      profile: user?.profile,
      goal,
      plan: plan && { version: plan.version, milestones: plan.milestones, replan_if: plan.replan_if },
      task,
      memories: memories.map((m) => m.summary),
      summary: conv.summary,
      progress: progress.map((p) => `${p.kind}: ${p.note}`),
      nudge: conv.nudge,
    },
  });
}
