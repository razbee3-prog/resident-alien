import "server-only";
import { EXPIRY_HOURS, type Category, type Report } from "./safety";
import { readLocal, storageMode, supabase, writeLocal } from "./storage";

type Row = Report & { ip_hash?: string };

/* ---------- demo seeds (in-memory, regenerated per process) ---------- */

const seedSpec: { metro: [number, number]; category: Category; note: string; minutesAgo: number; confirmations: number }[] = [
  { metro: [34.0522, -118.2437], category: "presence", note: "Two marked vehicles at the parking structure entrance on the north side.", minutesAgo: 12, confirmations: 3 },
  { metro: [34.0407, -118.2468], category: "courthouse", note: "Line at the side entrance, agents inside the lobby checking people leaving hearings.", minutesAgo: 48, confirmations: 6 },
  { metro: [41.8781, -87.6298], category: "checkpoint", note: "Traffic stop with several vehicles near the expressway on-ramp. Cars being waved over.", minutesAgo: 25, confirmations: 2 },
  { metro: [40.7128, -74.006], category: "presence", note: "Unmarked SUVs parked outside the building. Agents in vests on the sidewalk.", minutesAgo: 70, confirmations: 4 },
  { metro: [29.7604, -95.3698], category: "workplace", note: "Van and four agents at the warehouse loading dock. People being asked for documents.", minutesAgo: 35, confirmations: 5 },
  { metro: [33.4484, -112.074], category: "detention", note: "Saw one person taken into a vehicle outside the bus stop. Two agents.", minutesAgo: 95, confirmations: 2 },
  { metro: [33.749, -84.388], category: "presence", note: "Agents at the day-labor corner. People being questioned, no vehicles moving yet.", minutesAgo: 18, confirmations: 1 },
  { metro: [37.8044, -122.2712], category: "other", note: "Officers asking about residents at the apartment complex office. Not sure which agency.", minutesAgo: 140, confirmations: 0 },
  { metro: [32.7767, -96.797], category: "checkpoint", note: "Checkpoint on the frontage road, both directions slowed.", minutesAgo: 60, confirmations: 3 },
  { metro: [25.7617, -80.1918], category: "courthouse", note: "Agents at the family court entrance, checking IDs at the metal detector.", minutesAgo: 110, confirmations: 2 },
  { metro: [39.7392, -104.9903], category: "presence", note: "Three marked vehicles outside the community center during the morning clinic.", minutesAgo: 160, confirmations: 1 },
  { metro: [47.6062, -122.3321], category: "workplace", note: "Agents at the restaurant kitchen door before opening. Staff turned away.", minutesAgo: 80, confirmations: 2 },
];

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let demo: Row[] | null = null;
function demoReports(): Row[] {
  if (demo) return demo;
  const rnd = mulberry(20260912);
  const now = Date.now();
  demo = seedSpec.map((s, i) => {
    const created = new Date(now - s.minutesAgo * 60000);
    return {
      id: `demo-${i + 1}`,
      lat: Math.round((s.metro[0] + (rnd() - 0.5) * 0.06) * 1000) / 1000,
      lng: Math.round((s.metro[1] + (rnd() - 0.5) * 0.06) * 1000) / 1000,
      category: s.category,
      note: s.note,
      created_at: created.toISOString(),
      expires_at: new Date(created.getTime() + EXPIRY_HOURS * 3600000).toISOString(),
      confirmations: s.confirmations,
    };
  });
  return demo;
}

const demoConfirms = new Set<string>();

/* ---------- public API ---------- */

function strip(r: Row): Report {
  const { ip_hash: _ignored, ...rest } = r;
  void _ignored;
  return rest;
}

const live = (rows: Row[]) => rows.filter((r) => new Date(r.expires_at).getTime() > Date.now());

export async function listReports(): Promise<Report[]> {
  if (storageMode === "live") {
    const { data, error } = await supabase()
      .from("reports")
      .select("id,lat,lng,category,note,created_at,expires_at,confirmations")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Report[];
  }
  if (storageMode === "local") {
    const rows = live(await readLocal<Row[]>("reports", []));
    return rows.map(strip).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return live(demoReports()).map(strip).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addReport(input: { lat: number; lng: number; category: Category; note: string; ipHash: string }): Promise<Report> {
  const created = new Date();
  const row: Row = {
    id: crypto.randomUUID(),
    lat: input.lat,
    lng: input.lng,
    category: input.category,
    note: input.note,
    created_at: created.toISOString(),
    expires_at: new Date(created.getTime() + EXPIRY_HOURS * 3600000).toISOString(),
    confirmations: 0,
    ip_hash: input.ipHash,
  };
  if (storageMode === "live") {
    const { error } = await supabase().from("reports").insert(row);
    if (error) throw new Error(error.message);
    return strip(row);
  }
  if (storageMode === "local") {
    const rows = live(await readLocal<Row[]>("reports", []));
    await writeLocal("reports", [...rows, row]);
    return strip(row);
  }
  demoReports().push(row);
  return strip(row);
}

/** Returns the new confirmation count, or null if already confirmed / not found. */
export async function confirmReport(id: string, ipHash: string): Promise<number | null> {
  if (storageMode === "live") {
    const { error: insErr } = await supabase().from("report_confirmations").insert({ report_id: id, ip_hash: ipHash });
    if (insErr) return null; // unique violation = already confirmed
    const { data, error } = await supabase().rpc("increment_confirmations", { rid: id });
    if (error) throw new Error(error.message);
    return typeof data === "number" ? data : null;
  }
  const key = `${id}:${ipHash}`;
  if (demoConfirms.has(key)) return null;
  if (storageMode === "local") {
    const rows = await readLocal<Row[]>("reports", []);
    const r = rows.find((x) => x.id === id);
    if (!r) return null;
    r.confirmations += 1;
    demoConfirms.add(key);
    await writeLocal("reports", rows);
    return r.confirmations;
  }
  const r = demoReports().find((x) => x.id === id);
  if (!r) return null;
  r.confirmations += 1;
  demoConfirms.add(key);
  return r.confirmations;
}
