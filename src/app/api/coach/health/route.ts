import { NextResponse } from "next/server";
import { browserEnabled } from "@/lib/coach/browser-flag";
import { anthropicConfigured, MODELS } from "@/lib/coach/claude";
import { coachAvailable, db } from "@/lib/coach/db";
import { sendblueBaseUrl, sendblueMode, webhookSecretSource } from "@/lib/coach/sendblue";
import * as store from "@/lib/coach/store";
import { runTurn } from "@/lib/coach/turn";
import type { CoachEvent, Message, Run } from "@/lib/coach/types";
import { storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Operator diagnostics (bearer CRON_SECRET). Never returns secrets or message bodies beyond a short prefix. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });

  const config = {
    storageMode,
    coachAvailable,
    anthropicConfigured,
    models: MODELS,
    sendblueMode,
    sendblueBaseUrl,
    webhookSecretSource,
    browserEnabled,
    supabaseRole: describeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
    env: {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SENDBLUE_NUMBER: Boolean(process.env.SENDBLUE_NUMBER || process.env.NEXT_PUBLIC_SENDBLUE_NUMBER),
      SENDBLUE_API_KEY: Boolean(process.env.SENDBLUE_API_KEY_ID || process.env.SENDBLUE_API_KEY),
      SENDBLUE_SECRET: Boolean(process.env.SENDBLUE_API_SECRET_KEY || process.env.SENDBLUE_SECRET),
      BROWSERBASE_API_KEY: Boolean(process.env.BROWSERBASE_API_KEY),
      BROWSERBASE_PROJECT_ID: Boolean(process.env.BROWSERBASE_PROJECT_ID),
      ANTHROPIC_KEY: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_KEY),
    },
  };
  if (!coachAvailable) return NextResponse.json({ ok: false, config, error: "coach not configured" }, { status: 503 });

  try {
    const [users, messages, runs, events, connections, snapshots, recentMessages, recentRuns, recentEvents] = await Promise.all([
      db.count("coach_users"),
      db.count("coach_messages"),
      db.count("coach_runs"),
      db.count("coach_events"),
      db.count("coach_connections").catch(() => -1),
      db.count("coach_credit_snapshots").catch(() => -1),
      db.select<Message>("coach_messages", { order: { col: "created_at", asc: false }, limit: 5 }),
      db.select<Run>("coach_runs", { order: { col: "created_at", asc: false }, limit: 5 }),
      db.select<CoachEvent>("coach_events", { order: { col: "created_at", asc: false }, limit: 5 }),
    ]);
    return NextResponse.json({
      ok: true,
      config,
      counts: { users, messages, runs, events, connections, snapshots },
      recent: {
        messages: recentMessages.map((m) => ({ direction: m.direction, status: m.status, created_at: m.created_at, processed_at: m.processed_at, run_id: m.run_id, handle: m.message_handle?.slice(0, 12), preview: m.content.slice(0, 30) })),
        runs: recentRuns.map((r) => ({ trigger: r.trigger, intent: r.intent, error: r.error, duration_ms: r.duration_ms, model: r.model, created_at: r.created_at, replied: Boolean(r.response) })),
        events: recentEvents.map((e) => ({ kind: e.kind, created_at: e.created_at, detail: JSON.stringify(e.detail ?? null).slice(0, 200) })),
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, config, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/** JWT keys carry a `role` claim; newer opaque keys are identified by prefix. The key itself is never returned. */
function describeSupabaseKey(key: string | undefined): string {
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "opaque:sb_secret";
  if (key.startsWith("sb_publishable_")) return "opaque:sb_publishable (NOT a service key)";
  const parts = key.split(".");
  if (parts.length !== 3) return "unrecognized";
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as { role?: string; exp?: number };
    return `jwt:${payload.role ?? "unknown"}${payload.exp && payload.exp * 1000 < Date.now() ? " (EXPIRED)" : ""}`;
  } catch {
    return "jwt:unparseable";
  }
}

/** Operator actions (bearer CRON_SECRET). `sweep` processes every unprocessed inbound message right now and reports errors. */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!coachAvailable) return NextResponse.json({ ok: false, error: "coach not configured" }, { status: 503 });
  let body: { action?: string; phone?: string };
  try {
    body = (await req.json()) as { action?: string; phone?: string };
  } catch {
    body = {};
  }
  if (body.action === "issue_link") {
    // Operator shortcut for demos: a Credit Karma link for a phone number without going through the model.
    const { normalizePhone } = await import("@/lib/coach/text");
    const { site } = await import("@/lib/site");
    const phone = normalizePhone(String((body as { phone?: string }).phone ?? ""));
    if (!phone) return NextResponse.json({ ok: false, error: "phone must be E.164" }, { status: 400 });
    const user = await store.ensureUser(phone);
    const conn = await store.ensureConnection(user.id);
    const link = await store.issueLinkToken(user.id, conn.id);
    return NextResponse.json({ ok: true, url: `${site.url}/connect/${link.token}`, expires_at: link.expires_at });
  }
  if (body.action !== "sweep") return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });

  const results: unknown[] = [];
  const errors: string[] = [];
  let users;
  try {
    users = await store.listUsersWithUnprocessed(0);
  } catch (e) {
    return NextResponse.json({ ok: false, error: `list: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
  for (const user of users) {
    try {
      const r = await runTurn(user.id, { debounceMs: 0 });
      results.push({ user: user.id, turns: r.map((x) => ({ runId: x.runId, replied: x.replied, stage: x.stage, error: x.error })) });
    } catch (e) {
      errors.push(`${user.id}: ${e instanceof Error ? `${e.message}\n${e.stack?.split("\n").slice(0, 4).join(" | ")}` : String(e)}`);
    }
  }
  return NextResponse.json({ ok: errors.length === 0, users: users.length, results, errors });
}
