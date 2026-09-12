import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { DeliveryReceipt, MessagingProvider } from "./types";
import { normalizePhone, splitBubbles } from "./text";

const BASE = (process.env.SENDBLUE_BASE_URL || "https://api.sendblue.com").replace(/\/+$/, "");

/** Env aliases: SENDBLUE_API_KEY_ID or SENDBLUE_API_KEY; SENDBLUE_API_SECRET_KEY or SENDBLUE_SECRET. */
const cfg = {
  keyId: process.env.SENDBLUE_API_KEY_ID || process.env.SENDBLUE_API_KEY,
  secret: process.env.SENDBLUE_API_SECRET_KEY || process.env.SENDBLUE_SECRET,
  number: process.env.SENDBLUE_NUMBER || process.env.NEXT_PUBLIC_SENDBLUE_NUMBER,
  webhookSecret: process.env.SENDBLUE_WEBHOOK_SECRET,
  dryRun: process.env.SENDBLUE_DRY_RUN === "1" || process.env.SENDBLUE_DRY_RUN === "true",
};

export const sendblueMode: "live" | "dry" = cfg.keyId && cfg.secret && cfg.number && !cfg.dryRun ? "live" : "dry";

/** Sendblue echoes the secret you configured on the webhook in the `sb-signing-secret` header (shared secret, not an HMAC). */
export function verifyWebhook(req: Request): boolean {
  const expected = cfg.webhookSecret;
  if (!expected) return process.env.NODE_ENV !== "production";
  const got = req.headers.get("sb-signing-secret") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type InboundMessage = {
  handle: string;
  from: string;
  to: string | null;
  content: string;
  service: string | null;
  status: string | null;
  isOutbound: boolean;
  isGroup: boolean;
  optedOut: boolean;
  dateSent: string | null;
  mediaUrl: string | null;
  raw: Record<string, unknown>;
};

export function parseInbound(body: unknown): InboundMessage | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const handle = typeof b.message_handle === "string" ? b.message_handle : null;
  const from = typeof b.from_number === "string" ? normalizePhone(b.from_number) : null;
  if (!handle || !from) return null;
  const to = typeof b.to_number === "string" ? normalizePhone(b.to_number) : typeof b.sendblue_number === "string" ? normalizePhone(b.sendblue_number) : null;
  return {
    handle,
    from,
    to,
    content: typeof b.content === "string" ? b.content : "",
    service: typeof b.service === "string" ? b.service : null,
    status: typeof b.status === "string" ? b.status : null,
    isOutbound: b.is_outbound === true,
    isGroup: b.message_type === "group" || (typeof b.group_id === "string" && b.group_id.length > 0),
    optedOut: b.opted_out === true,
    dateSent: typeof b.date_sent === "string" ? b.date_sent : null,
    mediaUrl: typeof b.media_url === "string" && b.media_url ? b.media_url : null,
    raw: b,
  };
}

async function call(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "sb-api-key-id": cfg.keyId ?? "",
      "sb-api-secret-key": cfg.secret ?? "",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Sendblue ${path} ${res.status}: ${typeof json.error_message === "string" ? json.error_message : JSON.stringify(json)}`);
  return json;
}

export const sendblueProvider: MessagingProvider = {
  async send(to, text) {
    const bubbles = splitBubbles(text);
    const receipts: DeliveryReceipt[] = [];
    for (const content of bubbles) {
      if (sendblueMode === "dry") {
        console.info(`[sendblue:dry] → ${to}: ${content}`);
        receipts.push({ handle: `dry_${crypto.randomUUID()}`, status: "DRY_RUN", dryRun: true });
        continue;
      }
      const json = await call("/api/send-message", { number: to, from_number: cfg.number, content });
      receipts.push({ handle: typeof json.message_handle === "string" ? json.message_handle : null, status: typeof json.status === "string" ? json.status : "UNKNOWN", dryRun: false });
    }
    return receipts;
  },
  async typing(to) {
    if (sendblueMode === "dry") return;
    await call("/api/send-typing-indicator", { number: to, from_number: cfg.number, state: "start", max_duration_ms: 45000 }).catch((e) => console.warn("typing indicator failed", e));
  },
  async markRead(to) {
    if (sendblueMode === "dry") return;
    await call("/api/mark-read", { number: to, from_number: cfg.number }).catch((e) => console.warn("mark-read failed", e));
  },
};
