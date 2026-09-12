import { NextResponse } from "next/server";
import { findCountry } from "@/lib/countries";
import { hashIp, rateLimit, readLocal, storageMode, supabase, writeLocal } from "@/lib/storage";

type Entry = {
  id: string;
  email: string;
  segment: "student" | "professional";
  country: string;
  arrival: string | null;
  first_bill: string | null;
  created_at: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const segment = body.segment === "student" || body.segment === "professional" ? body.segment : null;
  const country = findCountry(typeof body.country === "string" ? body.country : null);
  const arrival = typeof body.arrival === "string" && /^\d{4}-\d{2}$/.test(body.arrival) ? body.arrival : null;
  const firstBill = typeof body.firstBill === "string" ? body.firstBill.trim().slice(0, 300) : null;

  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: "That email doesn’t look right." }, { status: 400 });
  if (!segment) return NextResponse.json({ ok: false, error: "Pick student or professional." }, { status: 400 });
  if (!country) return NextResponse.json({ ok: false, error: "Pick the country you’re coming from." }, { status: 400 });

  const ip = await hashIp(req);
  if (!rateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many signups from this connection. Try again in an hour." }, { status: 429 });
  }

  const entry: Entry = {
    id: crypto.randomUUID(),
    email,
    segment,
    country: country.a2,
    arrival,
    first_bill: firstBill || null,
    created_at: new Date().toISOString(),
  };

  if (storageMode === "live") {
    const { error } = await supabase().from("waitlist").upsert(entry, { onConflict: "email" });
    if (error) {
      console.error("waitlist insert failed", error.message);
      return NextResponse.json({ ok: false, error: "Couldn’t save that. Try again in a minute." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mode: "live" });
  }

  if (storageMode === "local") {
    const list = await readLocal<Entry[]>("waitlist", []);
    const next = [...list.filter((e) => e.email !== email), entry];
    await writeLocal("waitlist", next);
    return NextResponse.json({ ok: true, mode: "local" });
  }

  return NextResponse.json(
    { ok: false, mode: "demo", error: "The waitlist isn’t connected to a database yet. Email hello@resident-alien.com and we’ll add you by hand." },
    { status: 503 },
  );
}
