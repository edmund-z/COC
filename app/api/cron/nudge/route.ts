import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendPushNotification, PushSubscription } from "@/lib/webpush";
import { getLocalDate } from "@/lib/timezone";
import { appConfig } from "@/lib/config";

async function handler(req: NextRequest) {
  const isManual = req.headers.get("x-cron-trigger") === "manual";
  const authHeader = req.headers.get("authorization");
  if (!isManual && authHeader !== `Bearer ${appConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.fetchSettings();
  const today = getLocalDate(settings.timezone);

  const existing = await db.getEntryForDate(today);
  if (existing) return NextResponse.json({ skipped: true, reason: "already_logged" });

  if (!settings.push_subscription) {
    return NextResponse.json({ skipped: true, reason: "no_subscription" });
  }

  await sendPushNotification(settings.push_subscription as unknown as PushSubscription, {
    title: "Still haven't logged today",
    body: "Create or consume? Don't break the habit.",
    url: `${appConfig.appUrl}/log`,
  });

  return NextResponse.json({ ok: true });
}

export function GET(req: NextRequest) { return handler(req); }
export function POST(req: NextRequest) { return handler(req); }
