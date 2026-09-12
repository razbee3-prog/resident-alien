import "server-only";
import * as store from "./store";
import { daysBetween } from "./text";
import type { CoachUser, MessagingProvider } from "./types";

/**
 * Daily internal monitor. Observes state, records findings, and texts only for payment risk. Everything else
 * waits for the weekly check-in. Deterministic: no model call.
 */

export type Finding = { kind: string; detail: Record<string, unknown>; notify: boolean; text?: string };

function nextOccurrence(dayOfMonth: number, from: Date): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), Math.min(dayOfMonth, 28)));
  if (d.getTime() < from.getTime() - 86400000) d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

export async function findings(user: CoachUser): Promise<Finding[]> {
  const out: Finding[] = [];
  const now = new Date();
  const nowIso = now.toISOString();
  const p = user.profile;
  const task = await store.getActiveTask(user.id);

  if (task?.due_at && daysBetween(nowIso, task.due_at) < 0) {
    out.push({ kind: "task_overdue", detail: { task_id: task.id, title: task.title, days: -daysBetween(nowIso, task.due_at) }, notify: false });
  }

  if (p.has_credit_account && typeof p.payment_due_day === "number") {
    const due = nextOccurrence(p.payment_due_day, now);
    const days = daysBetween(nowIso, due.toISOString());
    if (days >= 0 && days <= 3 && p.autopay !== true) {
      out.push({
        kind: "payment_due_soon",
        detail: { due: due.toISOString().slice(0, 10), days, minimum: p.minimum_payment ?? null },
        notify: true,
        text: `Heads up from Credit Alien: your card payment looks due around the ${ordinal(p.payment_due_day)}. If autopay isn’t on yet, schedule at least the minimum${typeof p.minimum_payment === "number" ? ` ($${p.minimum_payment})` : ""} today so it can’t be late. Reply DONE when it’s set.`,
      });
    } else if (days >= 0 && days <= 7) {
      out.push({ kind: "payment_due_week", detail: { due: due.toISOString().slice(0, 10), days, autopay: p.autopay ?? null }, notify: false });
    }
  }

  if (typeof p.statement_close_day === "number" && typeof p.credit_limit === "number" && p.credit_limit > 0 && typeof p.current_balance === "number") {
    const close = nextOccurrence(p.statement_close_day, now);
    const days = daysBetween(nowIso, close.toISOString());
    const util = p.current_balance / p.credit_limit;
    if (days >= 0 && days <= 3 && util > 0.1) {
      out.push({ kind: "utilization_above_target", detail: { close: close.toISOString().slice(0, 10), utilization: Math.round(util * 100) }, notify: false });
    }
  }

  const monthly = (p.rent ?? 0) + (p.essentials ?? 0);
  if (typeof p.savings === "number" && monthly > 0 && p.savings < monthly) {
    out.push({ kind: "buffer_below_one_month", detail: { savings: p.savings, monthly }, notify: false });
  }

  if (user.next_checkin_at && user.next_checkin_at <= nowIso) {
    out.push({ kind: "checkin_due", detail: { next_checkin_at: user.next_checkin_at }, notify: false });
  }

  return out;
}

export async function runDailyMonitor(user: CoachUser, provider: MessagingProvider): Promise<{ findings: Finding[]; notified: boolean }> {
  const f = await findings(user);
  let notified = false;
  for (const x of f) await store.insertEvent(user.id, "monitor_finding", x);
  const alert = f.find((x) => x.notify && x.text);
  if (alert && !user.opted_out) {
    const receipts = await provider.send(user.phone, alert.text!);
    await store.insertOutbound({ user_id: user.id, handle: receipts[0]?.handle ?? null, content: alert.text!, status: receipts[0]?.status ?? "SENT", run_id: null });
    notified = true;
  }
  return { findings: f, notified };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
