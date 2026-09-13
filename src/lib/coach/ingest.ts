import "server-only";
import { isOptIn, isOptOut, redactPii } from "./policy";
import * as store from "./store";
import type { CoachUser, Message } from "./types";

export type IngestInput = { from: string; handle: string; content: string; service: string | null; status: string | null; optedOut: boolean; mediaUrl: string | null; dateSent: string | null };
export type IngestResult = { user: CoachUser; message: Message | null; action: "queued" | "duplicate" | "opted_out" | "opted_in" | "empty" };

/** Shared by the webhook and the simulator: identity, opt-out, PII redaction, idempotent insert. Never stores raw payloads. */
export async function ingestInbound(input: IngestInput): Promise<IngestResult> {
  let user = await store.ensureUser(input.from);

  if (input.optedOut || isOptOut(input.content)) {
    user = await store.updateUser(user.id, { opted_out: true });
    await store.insertEvent(user.id, "opt_out", { handle: input.handle });
    const m = await store.insertInbound({ user_id: user.id, handle: input.handle, content: input.content.slice(0, 40), service: input.service, status: input.status, payload: { opt_out: true } });
    if (m) await store.markProcessed([m.id], "opt-out");
    return { user, message: m, action: "opted_out" };
  }
  if (user.opted_out && isOptIn(input.content)) {
    user = await store.updateUser(user.id, { opted_out: false });
    const m = await store.insertInbound({ user_id: user.id, handle: input.handle, content: input.content.slice(0, 40), service: input.service, status: input.status, payload: { opt_in: true } });
    if (m) await store.markProcessed([m.id], "opt-in");
    return { user, message: m, action: "opted_in" };
  }

  const { text, hits } = redactPii(input.content);
  if (hits.length) await store.insertEvent(user.id, "pii_detected", { kinds: hits.map((h) => h.kind), handle: input.handle });
  const content = text.trim() || (input.mediaUrl ? "[sent an attachment]" : "");
  if (!content) return { user, message: null, action: "empty" };

  const message = await store.insertInbound({
    user_id: user.id,
    handle: input.handle,
    content,
    service: input.service,
    status: input.status,
    payload: { pii: hits.map((h) => h.kind), media: Boolean(input.mediaUrl), date_sent: input.dateSent },
  });
  if (!message) return { user, message: null, action: "duplicate" };
  return { user, message, action: "queued" };
}
