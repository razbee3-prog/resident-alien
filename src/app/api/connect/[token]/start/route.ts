import { NextResponse } from "next/server";
import { browserEnabled, createContext, createSession, liveViewUrl } from "@/lib/coach/browser";
import { coachAvailable } from "@/lib/coach/db";
import * as store from "@/lib/coach/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Opens the hosted browser for a link token: one session per token, reused if the page reloads. */
export async function POST(_req: Request, ctx: RouteContext<"/api/connect/[token]/start">) {
  const { token } = await ctx.params;
  if (!coachAvailable || !browserEnabled) return NextResponse.json({ ok: false, error: "The score check isn’t enabled right now." }, { status: 503 });
  const link = await store.getLinkToken(token);
  if (!link || link.status === "expired" || new Date(link.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, error: "This link has expired. Text Credit Alien for a new one." }, { status: 410 });
  if (link.status === "completed") return NextResponse.json({ ok: false, error: "This link was already used." }, { status: 410 });
  if (link.status === "opened" && link.live_view_url) return NextResponse.json({ ok: true, liveViewUrl: link.live_view_url, expiresAt: link.expires_at });

  try {
    const connection = await store.ensureConnection(link.user_id);
    let contextId = connection.context_id;
    if (!contextId) {
      contextId = await createContext();
      await store.updateConnection(connection.id, { context_id: contextId });
    }
    const session = await createSession(contextId, { device: "laptop", timeoutSec: 900, keepAlive: true });
    const url = await liveViewUrl(session.id);
    await store.updateLinkToken(token, { session_id: session.id, connect_url: session.connectUrl, live_view_url: url, device: "laptop", status: "opened" });
    return NextResponse.json({ ok: true, liveViewUrl: url, expiresAt: link.expires_at });
  } catch (e) {
    console.error("connect start failed", e);
    return NextResponse.json({ ok: false, error: `Couldn’t open the browser: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
