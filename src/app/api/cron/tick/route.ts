import { NextResponse } from "next/server";
import { coachAvailable } from "@/lib/coach/db";
import { runDailyMonitor } from "@/lib/coach/monitor";
import { sendblueProvider } from "@/lib/coach/sendblue";
import * as store from "@/lib/coach/store";
import { isoDate } from "@/lib/coach/text";
import { runTurn } from "@/lib/coach/turn";
import { runWeeklyCheckin } from "@/lib/coach/weekly";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily tick (Vercel Cron). Idempotent per user/kind/day via coach_jobs, so double-fires and reruns are safe.
 * Runs the internal monitor for every active user and the weekly check-in for users whose check-in is due.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!coachAvailable) return NextResponse.json({ ok: false, error: "coach not configured" }, { status: 503 });

  const today = isoDate();
  const nowIso = new Date().toISOString();
  let users;
  try {
    users = await store.listActiveUsers();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("tick: cannot read coach_users", e);
    return NextResponse.json({ ok: false, error: message, hint: "Run supabase/schema.sql if the coach_* tables do not exist yet." }, { status: 500 });
  }
  const out = { users: users.length, swept: 0, monitor: 0, notified: 0, weekly: 0, sent: 0, errors: [] as string[] };

  for (const user of users) {
    try {
      const stale = await store.listUnprocessed(user.id);
      if (stale.length && Date.now() - new Date(stale[0].created_at).getTime() > 10 * 60_000) {
        await runTurn(user.id, { debounceMs: 0 });
        out.swept += 1;
      }
      const job = await store.claimJob(user.id, "daily_monitor", today);
      if (job) {
        try {
          const r = await runDailyMonitor(user, sendblueProvider);
          await store.finishJob(job.id, "done", { findings: r.findings.map((f) => f.kind), notified: r.notified });
          out.monitor += 1;
          if (r.notified) out.notified += 1;
        } catch (e) {
          await store.finishJob(job.id, "failed", { error: String(e) });
          throw e;
        }
      }
      if (user.next_checkin_at && user.next_checkin_at <= nowIso) {
        const wj = await store.claimJob(user.id, "weekly_checkin", today);
        if (wj) {
          try {
            const r = await runWeeklyCheckin(user, sendblueProvider);
            await store.finishJob(wj.id, "done", { sent: r.sent, run_id: r.runId });
            out.weekly += 1;
            if (r.sent) out.sent += 1;
          } catch (e) {
            await store.finishJob(wj.id, "failed", { error: String(e) });
            throw e;
          }
        }
      }
    } catch (e) {
      console.error(`tick failed for ${user.id}`, e);
      out.errors.push(`${user.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return NextResponse.json({ ok: true, date: today, ...out });
}
