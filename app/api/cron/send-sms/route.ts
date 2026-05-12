import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendPushNotification, PushSubscription } from "@/lib/webpush";
import { generateToken } from "@/lib/token";
import { getLocalDate } from "@/lib/timezone";
import { appConfig } from "@/lib/config";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isManual = req.headers.get("x-cron-trigger") === "manual";
  if (!isManual && authHeader !== `Bearer ${appConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const today = getLocalDate(settings.timezone);

  const existing = await db.getEntryForDate(today);
  if (existing) {
    return NextResponse.json({ skipped: true, reason: "already_logged" });
  }

  if (!settings.push_subscription) {
    return NextResponse.json({ skipped: true, reason: "no_subscription" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  await db.insertToken(token, today, expiresAt);

  const url = `${appConfig.appUrl}/log/${token}`;
  await sendPushNotification(settings.push_subscription as unknown as PushSubscription, {
    title: "Create or Consume?",
    body: "Tap to log today.",
    url,
  });

  return NextResponse.json({ ok: true, today });
}
