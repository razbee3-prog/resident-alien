import { NextResponse } from "next/server";
import { browserEnabled } from "@/lib/coach/browser-flag";
import { coachAvailable } from "@/lib/coach/db";
import * as store from "@/lib/coach/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Opens the hosted browser for a link token: one session per token, reused if the page reloads. */
export async function POST(req: Request, ctx: RouteContext<"/api/connect/[token]/start">) {
  const { token } = await ctx.params;
  let body: { device?: string } = {};
  try {
    body = (await req.json()) as { device?: string };
  } catch {}
  const device = body.device === "phone" ? "phone" : "laptop";
  if (!coachAvailable || !browserEnabled) return NextResponse.json({ ok: false, error: "The score check isn’t enabled right now." }, { status: 503 });
  const link = await store.getLinkToken(token);
  if (!link || link.status === "expired" || new Date(link.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: "This link has expired. Text Credit Alien for a new one." }, { status: 410 });
  if (link.status === "completed") return NextResponse.json({ ok: false, error: "This link was already used." }, { status: 410 });
  if (link.status === "opened" && link.live_view_url) return NextResponse.json({ ok: true, liveViewUrl: link.live_view_url, connectUrl: link.connect_url, device: link.device, expiresAt: link.expires_at });

  let browser: typeof import("@/lib/coach/browser");
  try {
    browser = await import("@/lib/coach/browser");
  } catch (e) {
    console.error("browser module failed to load", e);
    return NextResponse.json({ ok: false, error: `Browser module failed to load: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
  const { createContext, createSession, liveViewUrl, openLoginPage, releaseSession } = browser;
  try {
    // One live session per user: release any earlier link's session so a retry never hits the concurrency cap.
    for (const old of await store.listOpenLinkTokens(link.user_id, token)) {
      if (old.session_id) await releaseSession(old.session_id);
      await store.updateLinkToken(old.token, { status: "expired" });
    }
    const connection = await store.ensureConnection(link.user_id);
    let contextId = connection.context_id;
    if (!contextId) {
      contextId = await createContext();
      await store.updateConnection(connection.id, { context_id: contextId });
    }
    const session = await createSession(contextId, { device, timeoutSec: 900, keepAlive: true });
    const landed = await openLoginPage(session.connectUrl);
    const url = await liveViewUrl(session.id);
    console.info(`connect start: session ${session.id} (${device}) landed on ${landed ?? "unknown"}`);
    await store.updateLinkToken(token, { session_id: session.id, connect_url: session.connectUrl, live_view_url: url, device, status: "opened" });
    // connectUrl is the session's own control channel, the same one the live view uses; the phone keyboard helper
    // talks to it directly so typed text goes phone → Browserbase, never through this server.
    return NextResponse.json({ ok: true, liveViewUrl: url, connectUrl: session.connectUrl, device, landed, expiresAt: link.expires_at });
  } catch (e) {
    console.error("connect start failed", e);
    return NextResponse.json({ ok: false, error: `Couldn’t open the browser: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
