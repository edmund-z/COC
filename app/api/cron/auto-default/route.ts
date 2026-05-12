import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getLocalDate, getPreviousDate } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const today = getLocalDate(settings.timezone);
  const yesterday = getPreviousDate(today);

  const existing = await db.getEntryForDate(yesterday);
  if (existing) {
    return NextResponse.json({ skipped: true, reason: "already_logged", date: yesterday });
  }

  await db.insertEntry(yesterday, "consume", "auto", true);
  return NextResponse.json({ ok: true, date: yesterday });
}
