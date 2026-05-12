import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { SUPPORTED_TIMEZONES } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const { timezone } = await req.json();
  const valid = SUPPORTED_TIMEZONES.map((t) => t.value);
  if (!valid.includes(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
  await db.updateSettings({ timezone });
  return NextResponse.json({ ok: true });
}
