import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendSms } from "@/lib/twilio";
import { generateToken } from "@/lib/token";
import { getLocalDate } from "@/lib/timezone";
import { appConfig } from "@/lib/config";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${appConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const today = getLocalDate(settings.timezone);

  const existing = await db.getEntryForDate(today);
  if (existing) {
    return NextResponse.json({ skipped: true, reason: "already_logged" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  await db.insertToken(token, today, expiresAt);

  const link = `${appConfig.appUrl}/log/${token}`;
  const body = `Create or Consume today? Reply C or X. Or tap: ${link}`;

  await sendSms(settings.phone, body);
  return NextResponse.json({ ok: true, today });
}
