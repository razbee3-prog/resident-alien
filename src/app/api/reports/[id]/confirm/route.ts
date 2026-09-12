import { NextResponse } from "next/server";
import { confirmReport } from "@/lib/safety-store";
import { hashIp, rateLimit } from "@/lib/storage";

export async function POST(req: Request, ctx: RouteContext<"/api/reports/[id]/confirm">) {
  const { id } = await ctx.params;
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ ok: false, error: "Bad id." }, { status: 400 });
  const ipHash = await hashIp(req);
  if (!rateLimit(`confirm:${ipHash}`, 30, 60 * 60 * 1000)) return NextResponse.json({ ok: false, error: "Slow down." }, { status: 429 });
  try {
    const count = await confirmReport(id, ipHash);
    if (count === null) return NextResponse.json({ ok: false, error: "Already confirmed from this connection, or the report expired." }, { status: 409 });
    return NextResponse.json({ ok: true, confirmations: count });
  } catch (e) {
    console.error("confirm failed", e);
    return NextResponse.json({ ok: false, error: "Couldn’t confirm right now." }, { status: 500 });
  }
}
