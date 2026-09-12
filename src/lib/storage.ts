import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

export type StorageMode = "live" | "local" | "demo";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const storageMode: StorageMode = url && key ? "live" : process.env.NODE_ENV === "development" ? "local" : "demo";

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!client) {
    if (!url || !key) throw new Error("Supabase is not configured");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

const dataDir = path.join(process.cwd(), ".data");

export async function readLocal<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, `${name}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeLocal<T>(name: string, value: T): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, `${name}.json`), JSON.stringify(value, null, 2), "utf8");
}

/** Best-effort, per-instance rate limit. Good enough to stop a loop, not a determined actor. */
const buckets = new Map<string, number[]>();
export function rateLimit(keyName: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(keyName) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(keyName, arr);
    return false;
  }
  arr.push(now);
  buckets.set(keyName, arr);
  return true;
}

export async function hashIp(req: Request): Promise<string> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.IP_HASH_SALT ?? "resident-alien";
  const data = new TextEncoder().encode(`${salt}:${day}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
