import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendSms } from "@/lib/twilio";
import { computeStreak } from "@/lib/streak";
import { getLocalHourMinute, getLocalDate } from "@/lib/timezone";
import { toZonedTime } from "date-fns-tz";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const { hour, dayOfWeek } = getLocalHourMinute(settings.timezone);

  // Sunday = 0, run at 20:00
  if (dayOfWeek !== 0 || hour !== 20) {
    return NextResponse.json({ skipped: true, dayOfWeek, hour });
  }

  const today = getLocalDate(settings.timezone);

  // Avoid duplicate summary on same day
  if (settings.last_summary_sent === today) {
    return NextResponse.json({ skipped: true, reason: "already_sent" });
  }

  // Get last 7 days
  const allEntries = await db.getAllEntries();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const weekEntries = allEntries.filter((e) => e.date >= weekAgo);

  const createCount = weekEntries.filter((e) => e.choice === "create").length;
  const consumeCount = weekEntries.filter((e) => e.choice === "consume").length;
  const streak = computeStreak(allEntries);
  const totalEntries = allEntries.length;
  const allCreateCount = allEntries.filter((e) => e.choice === "create").length;
  const createPct =
    totalEntries > 0 ? Math.round((allCreateCount / totalEntries) * 100) : 0;

  const body = `Last week: ${createCount} Create, ${consumeCount} Consume. Current streak: ${streak}. All-time Create %: ${createPct}%.`;
  await sendSms(settings.phone, body);
  await db.updateSettings({ last_summary_sent: today });

  return NextResponse.json({ ok: true });
}
