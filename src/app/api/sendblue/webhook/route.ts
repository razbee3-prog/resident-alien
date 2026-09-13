import { after, NextResponse } from "next/server";
import { coachAvailable } from "@/lib/coach/db";
import { ingestInbound } from "@/lib/coach/ingest";
import { parseInbound, verifyWebhook } from "@/lib/coach/sendblue";
import { updateDeliveryStatus } from "@/lib/coach/store";
import { runTurn } from "@/lib/coach/turn";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Sendblue inbound webhook. Verifies the shared secret, dedupes on message_handle, acks immediately, and runs the
 * agent turn after the response with `after()` (Sendblue waits 45 s and retries on 5xx, so never block here).
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
    if (r.action === "queued") {
      const userId = r.user.id;
      after(async () => {
        try {
          await runTurn(userId);
        } catch (e) {
          console.error("coach turn failed", e);
        }
      });
    }
    return NextResponse.json({ ok: true, action: r.action });
  } catch (e) {
    console.error("webhook ingest failed", e);
    return NextResponse.json({ ok: false, error: `ingest failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
