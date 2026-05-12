import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getLocalHour, getLocalDate, getPreviousDate } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const localHour = getLocalHour(settings.timezone);

  // Only auto-log after midnight (hour >= 0 but not 22/23 hour of same day)
  // We run at :05, check if hour is 0 or 1 — meaning we just passed midnight
  if (localHour > 2) {
    return NextResponse.json({ skipped: true, localHour });
  }

  const today = getLocalDate(settings.timezone);
  const yesterday = getPreviousDate(today);

  const existing = await db.getEntryForDate(yesterday);
  if (existing) {
    return NextResponse.json({ skipped: true, reason: "already_logged", date: yesterday });
  }

  await db.insertEntry(yesterday, "consume", "auto", true);
  return NextResponse.json({ ok: true, date: yesterday });
}
