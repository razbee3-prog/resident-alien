import { NextResponse } from "next/server";
import { coachAvailable } from "@/lib/coach/db";
import { ingestInbound } from "@/lib/coach/ingest";
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

  let body: { phone?: string; text?: string; mediaUrl?: string };
  try {
    body = (await req.json()) as { phone?: string; text?: string; mediaUrl?: string };
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
      stage: user?.onboarding_stage,
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
