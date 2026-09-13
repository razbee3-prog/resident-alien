import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { storageMode, supabase } from "@/lib/storage";

/**
 * Minimal table adapter with two backends: Supabase (live) and JSON files under .data/coach (local).
 * Domain logic lives in store.ts and is identical in both modes.
 */

export type Where = {
  eq?: Record<string, unknown>;
  isNull?: string[];
  notNull?: string[];
  lte?: Record<string, string | number>;
  lt?: Record<string, string | number>;
  gte?: Record<string, string | number>;
  gt?: Record<string, string | number>;
};
export type Query = Where & { order?: { col: string; asc?: boolean }; limit?: number };

export interface Db {
  select<T>(table: string, q?: Query): Promise<T[]>;
  /** Returns null on a unique-key violation. */
  insert<T extends Record<string, unknown>>(table: string, row: T): Promise<T | null>;
  update<T extends Record<string, unknown>>(table: string, match: Record<string, unknown>, patch: Partial<T>): Promise<T[]>;
  /** Atomically take the per-user turn lock. */
  acquireLock(userId: string, untilIso: string): Promise<boolean>;
  releaseLock(userId: string): Promise<void>;
  count(table: string): Promise<number>;
}

export const coachAvailable = storageMode !== "demo";

/* ------------------------------- live ------------------------------- */

const liveDb: Db = {
  async select<T>(table: string, q: Query = {}) {
    let s = supabase().from(table).select("*");
    for (const [k, v] of Object.entries(q.eq ?? {})) s = s.eq(k, v as never);
    for (const k of q.isNull ?? []) s = s.is(k, null);
    for (const k of q.notNull ?? []) s = s.not(k, "is", null);
    for (const [k, v] of Object.entries(q.lte ?? {})) s = s.lte(k, v);
    for (const [k, v] of Object.entries(q.lt ?? {})) s = s.lt(k, v);
    for (const [k, v] of Object.entries(q.gte ?? {})) s = s.gte(k, v);
    for (const [k, v] of Object.entries(q.gt ?? {})) s = s.gt(k, v);
    if (q.order) s = s.order(q.order.col, { ascending: q.order.asc ?? true });
    if (q.limit) s = s.limit(q.limit);
    const { data, error } = await s;
    if (error) throw new Error(`${table} select: ${error.message}`);
    return (data ?? []) as T[];
  },
  async insert(table, row) {
    const { data, error } = await supabase().from(table).insert(row).select().single();
    if (error) {
      if (error.code === "23505") return null;
      throw new Error(`${table} insert: ${error.message}`);
    }
    return data as typeof row;
  },
  async update(table, match, patch) {
    const { data, error } = await supabase().from(table).update(patch as never).match(match).select();
    if (error) throw new Error(`${table} update: ${error.message}`);
    return (data ?? []) as never;
  },
  async acquireLock(userId, untilIso) {
    const now = new Date().toISOString();
    const { data, error } = await supabase()
      .from("coach_conversations")
      .update({ lock_until: untilIso })
      .eq("user_id", userId)
      .or(`lock_until.is.null,lock_until.lt.${now}`)
      .select("user_id");
    if (error) throw new Error(`lock: ${error.message}`);
    return (data?.length ?? 0) > 0;
  },
  async releaseLock(userId) {
    const { error } = await supabase().from("coach_conversations").update({ lock_until: null }).eq("user_id", userId);
    if (error) throw new Error(`unlock: ${error.message}`);
  },
  async count(table) {
    const { count, error } = await supabase().from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`${table} count: ${error.message}`);
    return count ?? 0;
  },
};

/* ------------------------------- local ------------------------------ */

const dir = path.join(process.cwd(), ".data", "coach");
const uniqueKeys: Record<string, string[][]> = {
  coach_users: [["phone"]],
  coach_messages: [["message_handle"]],
  coach_plans: [["user_id", "version"]],
  coach_jobs: [["user_id", "kind", "run_date"]],
  coach_connections: [["user_id", "provider"]],
  coach_link_tokens: [["token"]],
};
const locks = new Map<string, number>();

async function readTable<T>(table: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(path.join(dir, `${table}.json`), "utf8")) as T[];
  } catch {
    return [];
  }
}
async function writeTable<T>(table: string, rows: T[]) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${table}.json`), JSON.stringify(rows, null, 2), "utf8");
}
const cmp = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? "")));
function matches(row: Record<string, unknown>, q: Where): boolean {
  for (const [k, v] of Object.entries(q.eq ?? {})) if (row[k] !== v) return false;
  for (const k of q.isNull ?? []) if (row[k] !== null && row[k] !== undefined) return false;
  for (const k of q.notNull ?? []) if (row[k] === null || row[k] === undefined) return false;
  for (const [k, v] of Object.entries(q.lte ?? {})) if (row[k] == null || cmp(row[k], v) > 0) return false;
  for (const [k, v] of Object.entries(q.lt ?? {})) if (row[k] == null || cmp(row[k], v) >= 0) return false;
  for (const [k, v] of Object.entries(q.gte ?? {})) if (row[k] == null || cmp(row[k], v) < 0) return false;
  for (const [k, v] of Object.entries(q.gt ?? {})) if (row[k] == null || cmp(row[k], v) <= 0) return false;
  return true;
}

const localDb: Db = {
  async select<T>(table: string, q: Query = {}) {
    let rows = (await readTable<Record<string, unknown>>(table)).filter((r) => matches(r, q));
    if (q.order) {
      const { col, asc = true } = q.order;
      rows = rows.sort((a, b) => (asc ? 1 : -1) * cmp(a[col], b[col]));
    }
    if (q.limit) rows = rows.slice(0, q.limit);
    return rows as T[];
  },
  async insert(table, row) {
    const rows = await readTable<Record<string, unknown>>(table);
    for (const key of uniqueKeys[table] ?? []) {
      if (key.some((k) => row[k] === null || row[k] === undefined)) continue;
      if (rows.some((r) => key.every((k) => r[k] === row[k]))) return null;
    }
    rows.push(row);
    await writeTable(table, rows);
    return row;
  },
  async update(table, match, patch) {
    const rows = await readTable<Record<string, unknown>>(table);
    const out: Record<string, unknown>[] = [];
    for (const r of rows) {
      if (Object.entries(match).every(([k, v]) => r[k] === v)) {
        Object.assign(r, patch);
        out.push(r);
      }
    }
    await writeTable(table, rows);
    return out as never;
  },
  async acquireLock(userId, untilIso) {
    const now = Date.now();
    const held = locks.get(userId);
    if (held && held > now) return false;
    locks.set(userId, new Date(untilIso).getTime());
    return true;
  },
  async releaseLock(userId) {
    locks.delete(userId);
    await localDb.update("coach_conversations", { user_id: userId }, { lock_until: null });
  },
  async count(table) {
    return (await readTable(table)).length;
  },
};

export const db: Db = storageMode === "live" ? liveDb : localDb;
