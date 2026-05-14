import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendPushNotification, PushSubscription } from "@/lib/webpush";
import { generateToken } from "@/lib/token";
import { getLocalDate, getLocalHour } from "@/lib/timezone";
import { appConfig } from "@/lib/config";

async function handler(req: NextRequest, isCron: boolean) {
  if (isCron) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${appConfig.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await db.fetchSettings();
  const today = getLocalDate(settings.timezone);

  if (isCron) {
    const localHour = getLocalHour(settings.timezone);
    const notifHour = settings.notification_hour ?? 20;
    if (localHour !== notifHour) {
      return NextResponse.json({ skipped: true, reason: "not_notification_hour" });
    }
  }

  const existing = await db.getEntryForDate(today);
  if (existing) return NextResponse.json({ skipped: true, reason: "already_logged" });

  if (!settings.push_subscription) {
    return NextResponse.json({ skipped: true, reason: "no_subscription" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  await db.insertToken(token, today, expiresAt);

  await sendPushNotification(settings.push_subscription as unknown as PushSubscription, {
    title: "Create or Consume?",
    body: "Tap to log today.",
    url: `${appConfig.appUrl}/log/${token}`,
  });

  return NextResponse.json({ ok: true, today });
}

export function GET(req: NextRequest) { return handler(req, true); }
export function POST(req: NextRequest) { return handler(req, false); }
