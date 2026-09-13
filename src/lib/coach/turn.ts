import "server-only";
import { anthropicConfigured } from "./claude";
import { buildPacket, renderPacket } from "./context";
import { agentLoop } from "./llm";
import { extractAndUpdate } from "./memory";
import { browserEnabled } from "./browser-flag";
import { connectedInstruction, effectiveStage, parseButtonPrefill, situationKnown, stageInstruction } from "./onboarding";
import { IMMIGRATION_REFERRAL, OUTBOUND_FALLBACK, PII_WARNING, isImmigrationStatusQuestion, outboundProblems } from "./policy";
import { route, type Route } from "./router";
import { extractScore, fetchImage } from "./score-vision";
import { sendblueProvider } from "./sendblue";
import type { SkillName } from "./skills";
import * as store from "./store";
import type { CoachUser, Message, MessagingProvider, OnboardingStage } from "./types";
import { readThroughConnection } from "./weekly";

const DEBOUNCE_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type TurnResult = { runId: string; replied: boolean; reply: string | null; stage: OnboardingStage; skills: string[]; intent: string | null; error: string | null };

/**
 * Entry point after a webhook ack. Debounces rapid-fire texts, takes the per-user lock, and processes every
 * unprocessed inbound message as one turn. If another invocation holds the lock, it will pick our message up.
 */
export async function runTurn(userId: string, opts: { provider?: MessagingProvider; trigger?: "inbound" | "simulate"; debounceMs?: number } = {}): Promise<TurnResult[]> {
  const provider = opts.provider ?? sendblueProvider;
  const trigger = opts.trigger ?? "inbound";
  await sleep(opts.debounceMs ?? DEBOUNCE_MS);
  const results: TurnResult[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!(await store.acquireTurnLock(userId))) return results;
    try {
      for (let i = 0; i < 3; i++) {
        const pending = await store.listUnprocessed(userId);
        if (pending.length === 0) break;
        results.push(await processBatch(userId, pending, provider, trigger));
      }
    } finally {
      await store.releaseTurnLock(userId);
    }
    // A message may have landed between our last check and the release; sweep once.
    if ((await store.listUnprocessed(userId)).length === 0) break;
  }
  return results;
}

async function processBatch(userId: string, pending: Message[], provider: MessagingProvider, trigger: "inbound" | "simulate"): Promise<TurnResult> {
  const t0 = Date.now();
  const runId = crypto.randomUUID();
  const ids = pending.map((m) => m.id);
  let user = (await store.getUser(userId))!;
  const text = pending.map((m) => m.content).join("\n").trim();
  const piiFlagged = pending.some((m) => Array.isArray((m.payload as { pii?: unknown[] } | null)?.pii) && ((m.payload as { pii: unknown[] }).pii.length > 0));
  const base = { runId, stage: effectiveStage(user), skills: [] as string[], intent: null as string | null, error: null as string | null };

  const finish = async (reply: string | null, extra: Partial<TurnResult> & { packet?: unknown; log?: unknown; usage?: unknown; model?: string | null; policy?: unknown }) => {
    await store.markProcessed(ids, runId);
    let sendError: string | null = null;
    if (reply) {
      try {
        const receipts = await provider.send(user.phone, reply);
        await store.insertOutbound({ user_id: userId, handle: receipts[0]?.handle ?? null, content: reply, status: receipts[0]?.status ?? "SENT", run_id: runId });
      } catch (e) {
        sendError = `send_failed: ${e instanceof Error ? e.message : String(e)}`;
        console.error("coach send failed", e);
        await store.insertEvent(userId, "delivery_error", { run_id: runId, error: sendError }).catch(() => {});
      }
    }
    await store.insertRun({
      id: runId,
      user_id: userId,
      trigger,
      intent: extra.intent ?? base.intent,
      skills: extra.skills ?? base.skills,
      packet: extra.packet ?? null,
      tool_calls: extra.log ?? null,
      model: extra.model ?? null,
      usage: extra.usage ?? null,
      policy: extra.policy ?? null,
      response: reply,
      error: [extra.error, sendError].filter(Boolean).join("; ") || null,
      duration_ms: Date.now() - t0,
    });
    return { ...base, ...extra, replied: Boolean(reply), reply, stage: (extra.stage ?? effectiveStage(user)) as OnboardingStage } as TurnResult;
  };

  if (user.opted_out || !text) return finish(null, {});
  if (!anthropicConfigured) return finish(null, { error: "ANTHROPIC_API_KEY not set" });

  // Hard route: RESET wipes this user's own coach data (demo rehearsal) without a model call.
  if (/^\s*reset\b/i.test(text)) {
    const conn = await store.getConnection(userId);
    if (conn?.context_id) {
      const { deleteContext } = await import("./browser");
      await deleteContext(conn.context_id);
    }
    await store.resetUser(userId);
    return finish("Fresh start 👽 I’ve cleared everything I knew. Text me anything to begin again.", { intent: "reset", stage: "new" });
  }

  // Hard route: DISCONNECT revokes the Credit Karma session without a model call.
  if (/^\s*disconnect\b/i.test(text)) {
    const conn = await store.getConnection(userId);
    if (conn?.context_id) {
      const { deleteContext } = await import("./browser");
      await deleteContext(conn.context_id);
    }
    if (conn) await store.updateConnection(conn.id, { status: "revoked", context_id: null });
    return finish(conn && conn.status !== "revoked" ? "Done. I deleted the saved Credit Karma session and won’t re-check your score. Text “check my score” whenever you want to connect again." : "Nothing to disconnect right now. Text “check my score” if you want me to start tracking it.", { intent: "disconnect_credit" });
  }

  // Hard route: individual immigration/status questions never reach the model.
  if (user.onboarding_stage === "active" && isImmigrationStatusQuestion(text)) {
    await store.insertEvent(userId, "escalation", { reason: "immigration_question", text: text.slice(0, 200) });
    return finish(IMMIGRATION_REFERRAL, { intent: "immigration_status", policy: { hard_route: "immigration" } });
  }

  // Onboarding stage (legacy 'consent' rows behave as 'situation'). Texting first is the consent to reply.
  const stage: OnboardingStage = effectiveStage(user);
  const prefill = stage === "new" ? parseButtonPrefill(text) : undefined;
  if (!user.consent_messaging_at) user = await store.updateUser(userId, { consent_messaging_at: new Date().toISOString() });

  // Skills: onboarding until active, then routed.
  let routed: Route | null = null;
  let skills: SkillName[];
  const activeTask = await store.getActiveTask(userId);
  if (stage !== "active") skills = ["onboarding"];
  else {
    routed = await route(text, activeTask?.title ?? null);
    skills = routed.skills as SkillName[];
    // A task report needs the planning tools (complete_task + set_weekly_task) whatever else was routed.
    if ((routed.task_signal === "reports_done" || routed.task_signal === "reports_blocked" || routed.task_signal === "wants_new_goal") && !skills.includes("plan_and_goals")) {
      skills = [...skills, "plan_and_goals"];
    }
    if (routed.task_signal === "wants_score_check" && !skills.includes("credit_coach")) skills = [...skills, "credit_coach"];
  }

  const conv = await store.getConversation(userId);
  const recent = (await store.recentMessages(userId, 14)).filter((m) => !ids.includes(m.id)).slice(-12);
  const packet = await buildPacket(user, conv, recent);
  let instruction = stageInstruction(stage, user.profile, { prefill, browserEnabled });
  const notes: string[] = [];
  const screenshotNote = await readTextedScreenshot(userId, pending);
  if (screenshotNote) notes.push(screenshotNote);

  // Credit Karma through the saved session. "Check my score" once active, or any nudge about it while a link is open,
  // reads the score here (inside the webhook's budget) so the reply quotes a fresh number instead of another login link.
  // A read that lands before the plan exists, or a follow-up an earlier invocation never delivered, becomes the
  // connected presentation: summary, plan v1, the long game.
  const pendingFollowup = user.profile.pending_followup?.note ?? null;
  let followup: string | null = pendingFollowup;
  let issuedLinkUrl: string | null = null;
  const wantsScore = routed ? routed.task_signal === "wants_score_check" : stage === "connect" && /score|karma|log+ed|connect|done|did it|finished|read it/i.test(text);
  if (wantsScore && !screenshotNote) {
    await provider.typing(user.phone).catch(() => {}); // the read takes 15 s or more; show the dots meanwhile
    const read = await readThroughConnection(user, { timeoutMs: 60_000, relinkTtlMinutes: 15, allowPending: true });
    if (read?.kind === "fresh") {
      if (stage === "active" && !followup) notes.push(`Fresh Credit Karma read just now through the saved session: ${read.line}. Quote it with model, bureau, and date and tie it to the plan. No new link is needed; do not call request_credit_link.`);
      else followup = read.note;
    } else if (read?.kind === "relogin") {
      issuedLinkUrl = read.linkUrl;
      notes.push(`The saved Credit Karma session has expired. A fresh link was already issued, so do not call request_credit_link. Put this exact URL in your reply on its own line and ask them to log in again (phone or laptop): ${read.linkUrl}`);
    }
  }
  if (followup) {
    notes.push(followup);
    instruction = connectedInstruction({ inbound: true });
    for (const s of ["onboarding", "plan_and_goals", "credit_coach"] as SkillName[]) if (!skills.includes(s)) skills = [...skills, s];
  }
  if (piiFlagged) notes.push("Sensitive data in the user's message was removed and a security warning was already sent. Do not repeat the warning; do not ask for the data.");
  if (routed?.sensitive && routed.sensitive !== "none" && routed.sensitive !== "sensitive_data") notes.push(`Router flagged: ${routed.sensitive}. Follow the operations playbook and call flag_for_human if it applies.`);
  if (routed?.task_signal && routed.task_signal !== "none") notes.push(`Router: task_signal=${routed.task_signal}.`);
  const userTurn = [renderPacket(packet, instruction), notes.length ? `Notes:\n${notes.map((n) => `- ${n}`).join("\n")}` : "", `NEW MESSAGE${pending.length > 1 ? "S" : ""} FROM USER:\n${text}`].filter(Boolean).join("\n\n");

  await provider.markRead(user.phone).catch(() => {});
  await provider.typing(user.phone).catch(() => {});

  let loop;
  try {
    loop = await agentLoop({ user, skills, userTurn });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("agent loop failed", e);
    const apology = "Something broke on my end. Give me a minute and text me again.";
    return finish(piiFlagged ? `${PII_WARNING}\n\n${apology}` : apology, { error: msg, packet, intent: routed?.intent ?? null, skills });
  }

  // Outbound guard: one rewrite, then a canned fallback.
  let reply = loop.text;
  const policy: Record<string, unknown> = { problems: outboundProblems(reply) };
  if ((policy.problems as string[]).length) {
    try {
      const rewrite = await agentLoop({ user, skills, userTurn: `${userTurn}\n\nYOUR DRAFT REPLY WAS REJECTED by the policy guard for these phrases: ${(policy.problems as string[]).join("; ")}. Rewrite it without promises or guarantees, same meaning, same length. Reply with the rewritten text only, no tool calls.` });
      reply = outboundProblems(rewrite.text).length ? OUTBOUND_FALLBACK : rewrite.text;
      policy.rewritten = true;
    } catch {
      reply = OUTBOUND_FALLBACK;
    }
  }
  if (!reply) reply = "Got it. What would you like to tackle next?";
  const linkUrl = loop.effects.linkUrl ?? issuedLinkUrl;
  if (linkUrl && !reply.includes(linkUrl)) reply = `${reply.replace(/\[[^\]]*link[^\]]*\]/gi, "").trim()}\n\n${linkUrl}`;
  if (piiFlagged) reply = `${PII_WARNING}\n\n${reply}`;

  // Stage advancement from tool effects and profile facts.
  const fx = loop.effects;
  const profileNow = fx.profile ?? user.profile;
  let nextStage: OnboardingStage = stage;
  if (stage === "new") nextStage = situationKnown(profileNow) ? "goal" : "situation";
  else if (stage === "situation" && situationKnown(profileNow)) nextStage = fx.goalSet ? (fx.linkIssued ? "connect" : "context") : "goal";
  else if (stage === "goal" && fx.goalSet) nextStage = fx.linkIssued ? "connect" : "context";
  else if (stage === "connect" && fx.skipConnection) nextStage = "context";
  else if ((stage === "connect" || stage === "context") && fx.planCreated && fx.taskSet) nextStage = "active";
  if (nextStage !== stage || fx.taskSet) {
    const patch: Partial<CoachUser> = {};
    if (nextStage === "active" && !user.next_checkin_at) patch.next_checkin_at = new Date(Date.now() + 7 * 86400000).toISOString();
    if (fx.taskSet) patch.next_checkin_at = new Date(Math.min(new Date(fx.taskSet.due_at ?? Date.now() + 7 * 86400000).getTime(), Date.now() + 7 * 86400000)).toISOString();
    user = await store.setStage({ ...user, profile: profileNow }, nextStage, patch);
  }

  const result = await finish(reply, { stage: nextStage, skills, intent: routed?.intent ?? (stage === "active" ? null : `onboarding_${stage}`), packet, log: loop.log, usage: loop.usage, model: loop.model, policy, error: loop.refused ? "refusal" : null });
  // The follow-up reached them: drop the marker (kept if the send failed so the next turn tries again).
  if (followup && !result.error?.includes("send_failed")) await store.clearPendingFollowup(userId).catch((e) => console.warn("clear follow-up failed", e));

  // Post-turn memory pass (async-safe: we are already inside after()). Never let it mask a delivered reply.
  try {
    const existing = await store.listMemories(userId, 20);
    const task = fx.taskSet ?? activeTask;
    await extractAndUpdate({ user, conv, task, existing, userText: text, reply, toolNames: loop.log.map((l) => l.name) });
  } catch (e) {
    console.error("memory pass failed", e);
  }
  return result;
}

/** If the user texted an image, try to read a credit score off it and record a snapshot. Never throws. */
async function readTextedScreenshot(userId: string, pending: Message[]): Promise<string | null> {
  const urls = pending.map((m) => (m.payload as { media_url?: unknown } | null)?.media_url).filter((u): u is string => typeof u === "string" && u.length > 0);
  if (urls.length === 0) return null;
  try {
    const image = await fetchImage(urls[urls.length - 1]);
    if (!image) return "The user texted an attachment that could not be read as an image. If they meant to send a score screenshot, ask for a PNG or JPG of the score card.";
    const x = await extractScore({ image, provider: "user screenshot (Credit Karma / Experian / bank app)" });
    if (x.score === null) return `The user texted a screenshot but no score was legible (${x.notes}). Ask them for a screenshot of the score card itself.`;
    const previous = (await store.listSnapshots(userId, 1))[0] ?? null;
    await store.insertSnapshot(userId, { source: "screenshot", score: x.score, score_model: x.score_model, bureau: x.bureau, as_of: x.as_of, confidence: x.confidence, extract: x });
    const delta = previous?.score !== null && previous?.score !== undefined ? x.score - previous.score : null;
    return `The user texted a screenshot of their score. Recorded snapshot: ${x.score}${x.score_model ? ` ${x.score_model}` : ""}${x.bureau ? `, ${x.bureau}` : ""}${x.as_of ? `, as of ${x.as_of}` : ""} (confidence ${x.confidence})${previous ? `; previous on file ${previous.score ?? "unreadable"}${delta !== null ? ` (${delta >= 0 ? "+" : ""}${delta})` : ""}` : "; first score on file"}. Confirm it back with model, bureau, and date, and tie it to the plan.`;
  } catch (e) {
    console.warn("screenshot read failed", e);
    return null;
  }
}
