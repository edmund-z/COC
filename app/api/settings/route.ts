import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { SUPPORTED_TIMEZONES } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const { timezone, notification_hour } = await req.json();
  const valid = SUPPORTED_TIMEZONES.map((t) => t.value);
  if (!valid.includes(timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { timezone };
  if (typeof notification_hour === "number" && notification_hour >= 0 && notification_hour <= 23) {
    patch.notification_hour = notification_hour;
  }
  await db.updateSettings(patch as Parameters<typeof db.updateSettings>[0]);
  return NextResponse.json({ ok: true });
}
