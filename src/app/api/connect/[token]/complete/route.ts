import { NextResponse } from "next/server";
import { browserEnabled } from "@/lib/coach/browser-flag";
import { coachAvailable } from "@/lib/coach/db";
import { runEventTurn } from "@/lib/coach/event";
import { connectedInstruction } from "@/lib/coach/onboarding";
import { sendblueProvider } from "@/lib/coach/sendblue";
import * as store from "@/lib/coach/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** The user says they're logged in: read the score page, store a snapshot, keep the cookies, text the score. */
export async function POST(_req: Request, ctx: RouteContext<"/api/connect/[token]/complete">) {
  const { token } = await ctx.params;
  if (!coachAvailable || !browserEnabled) return NextResponse.json({ ok: false }, { status: 503 });
  const link = await store.getLinkToken(token);
  if (!link || link.status !== "opened" || !link.connect_url || !link.session_id) return NextResponse.json({ ok: false, error: "Open the link first." }, { status: 409 });

  let browser: typeof import("@/lib/coach/browser");
  try {
    browser = await import("@/lib/coach/browser");
  } catch (e) {
    console.error("browser module failed to load", e);
    return NextResponse.json({ ok: false, error: `Browser module failed to load: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
  const { captureAndRead, releaseSession } = browser;
  try {
    const read = await captureAndRead(link.connect_url);
    if (!read.loggedIn) return NextResponse.json({ ok: false, reason: "not_logged_in", notes: read.extraction?.notes ?? "Still on the login page." });

    const x = read.extraction!;
    const snapshot = await store.insertSnapshot(link.user_id, { source: "credit_karma_browser", score: x.score, score_model: x.score_model, bureau: x.bureau, as_of: x.as_of, confidence: x.confidence, extract: x });
    if (link.connection_id) await store.updateConnection(link.connection_id, { status: "active", last_ok_at: new Date().toISOString(), last_error: null });
    await store.updateLinkToken(token, { status: "completed" });
    await releaseSession(link.session_id);

    await store.insertProgress(link.user_id, { task_id: null, kind: "advance", note: `Credit Karma connected; score ${x.score ?? "unreadable"} recorded (${snapshot.id.slice(0, 8)}).` });

    // The coach speaks: summary of what it saw, plan v1, and the long game. Falls back to a plain text if the turn fails.
    const scoreLine = x.score !== null ? `${x.score}${x.score_model ? ` ${x.score_model}` : ""}${x.bureau ? `, ${x.bureau}` : ""}${x.as_of ? `, as of ${x.as_of}` : ""}` : "no score legible";
    const note = `Credit Karma read just now: score ${scoreLine} (confidence ${x.confidence}). Utilization ${x.utilization_percent ?? "n/a"}%, on-time ${x.on_time_percent ?? "n/a"}%, accounts ${x.total_accounts ?? "n/a"}, derogatory ${x.derogatory_marks ?? "n/a"}. Observations: ${x.observations} A snapshot was recorded; the connection is active and will be re-read weekly.`;
    try {
      await runEventTurn(link.user_id, { trigger: "inbound", intent: "credit_karma_connected", skills: ["onboarding", "plan_and_goals", "credit_coach"], notes: [note], instruction: connectedInstruction() });
    } catch (e) {
      console.error("connected turn failed; sending fallback", e);
      const user = await store.getUser(link.user_id);
      const text = x.score !== null ? `Connected 👽 Your Credit Karma score right now: ${scoreLine}. I’ll build your plan from this and text it in a moment.` : `Connected 👽 I got in but couldn’t read a score on the page (${x.notes}). Open the score card once in Credit Karma, then text me "check my score".`;
      if (user && !user.opted_out) {
        const receipts = await sendblueProvider.send(user.phone, text);
        await store.insertOutbound({ user_id: user.id, handle: receipts[0]?.handle ?? null, content: text, status: receipts[0]?.status ?? "SENT", run_id: null });
      }
    }
    return NextResponse.json({ ok: true, score: x.score, score_model: x.score_model, bureau: x.bureau, as_of: x.as_of });
  } catch (e) {
    console.error("connect complete failed", e);
    if (link.connection_id) await store.updateConnection(link.connection_id, { last_error: e instanceof Error ? e.message : String(e) }).catch(() => {});
    return NextResponse.json({ ok: false, error: `Couldn’t read the page: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
