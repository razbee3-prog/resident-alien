import { NextResponse } from "next/server";
import { isCategory, noteProblem, roundCoord } from "@/lib/safety";
import { addReport, listReports } from "@/lib/safety-store";
import { hashIp, rateLimit, storageMode } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reports = await listReports();
    return NextResponse.json({ ok: true, mode: storageMode, reports }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("reports list failed", e);
    return NextResponse.json({ ok: false, error: "Couldn’t load reports right now." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON." }, { status: 400 });
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const category = body.category;
  const note = String(body.note ?? "").trim();
  const attest = body.attest === true;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return NextResponse.json({ ok: false, error: "Tap the map or use your location first." }, { status: 400 });
  if (!isCategory(category)) return NextResponse.json({ ok: false, error: "Pick what you saw." }, { status: 400 });
  if (note.length < 8) return NextResponse.json({ ok: false, error: "Add a sentence about what you saw." }, { status: 400 });
  const problem = noteProblem(note);
  if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
  if (!attest) return NextResponse.json({ ok: false, error: "Confirm the note describes activity, not a person." }, { status: 400 });

  const ipHash = await hashIp(req);
  if (!rateLimit(`report:${ipHash}`, 3, 60 * 60 * 1000))
    return NextResponse.json({ ok: false, error: "Three reports an hour per connection. Call the hotline if it’s urgent." }, { status: 429 });

  try {
    const report = await addReport({ lat: roundCoord(lat), lng: roundCoord(lng), category, note, ipHash });
    return NextResponse.json({ ok: true, mode: storageMode, report });
  } catch (e) {
    console.error("report insert failed", e);
    return NextResponse.json({ ok: false, error: "Couldn’t save the report. Try again in a minute." }, { status: 500 });
  }
}
