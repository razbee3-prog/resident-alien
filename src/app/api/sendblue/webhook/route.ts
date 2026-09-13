import { NextResponse } from "next/server";
import { coachAvailable } from "@/lib/coach/db";
import { ingestInbound } from "@/lib/coach/ingest";
import { parseInbound, verifyWebhook } from "@/lib/coach/sendblue";
import { updateDeliveryStatus } from "@/lib/coach/store";
import { runTurn } from "@/lib/coach/turn";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Sendblue inbound webhook. Verifies the shared secret, dedupes on message_handle, then runs the agent turn inline
 * and acks when it is done. Next's after() hook did not execute the turn on Vercel, so the turn runs in the request.
 * If a turn outruns Sendblue's 45 s wait, Sendblue retries; the retry hits the duplicate check and returns at once
 * while this invocation keeps working (maxDuration below). The daily tick sweeps anything that still slipped.
 */
export async function POST(req: Request) {
  if (!verifyWebhook(req)) return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  if (!coachAvailable) return NextResponse.json({ ok: false, error: "coach not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON." }, { status: 400 });
  }
  const msg = parseInbound(body);
  if (!msg) return NextResponse.json({ ok: true, ignored: "unparseable" });

  if (msg.isOutbound) {
    if (msg.status) await updateDeliveryStatus(msg.handle, msg.status).catch((e) => console.warn("status update failed", e));
    return NextResponse.json({ ok: true, ignored: "outbound status" });
  }
  if (msg.isGroup) return NextResponse.json({ ok: true, ignored: "group" });

  try {
    const r = await ingestInbound({ from: msg.from, handle: msg.handle, content: msg.content, service: msg.service, status: msg.status, optedOut: msg.optedOut, mediaUrl: msg.mediaUrl, dateSent: msg.dateSent });
    console.info(`sendblue inbound ${msg.handle} from ${msg.from.slice(0, 5)}… → ${r.action}`);
    if (r.action !== "queued") return NextResponse.json({ ok: true, action: r.action });
    try {
      const turns = await runTurn(r.user.id, { debounceMs: 1500 });
      return NextResponse.json({ ok: true, action: r.action, turns: turns.map((t) => ({ runId: t.runId, replied: t.replied, error: t.error })) });
    } catch (e) {
      console.error("coach turn failed", e);
      // The message is stored and unprocessed; the daily tick's sweep will retry it. Ack so Sendblue does not re-send.
      return NextResponse.json({ ok: true, action: r.action, turnError: e instanceof Error ? e.message : String(e) });
    }
  } catch (e) {
    console.error("webhook ingest failed", e);
    return NextResponse.json({ ok: false, error: `ingest failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
