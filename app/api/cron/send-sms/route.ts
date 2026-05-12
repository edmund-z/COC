import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendSms } from "@/lib/twilio";
import { generateToken } from "@/lib/token";
import { getLocalHour, getLocalDate } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  // Vercel cron auth
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const localHour = getLocalHour(settings.timezone);

  if (localHour !== 22) {
    return NextResponse.json({ skipped: true, localHour });
  }

  const today = getLocalDate(settings.timezone);
  const existing = await db.getEntryForDate(today);
  if (existing) {
    return NextResponse.json({ skipped: true, reason: "already_logged" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2h
  await db.insertToken(token, today, expiresAt);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${appUrl}/log/${token}`;
  const body = `Create or Consume today? Reply C or X. Or tap: ${link}`;

  await sendSms(settings.phone, body);

  return NextResponse.json({ ok: true, today });
}
