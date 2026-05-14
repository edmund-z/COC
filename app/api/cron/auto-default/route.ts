import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getLocalDate, getPreviousDate } from "@/lib/timezone";
import { appConfig } from "@/lib/config";

async function handler(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${appConfig.cronSecret}`) {
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

export function GET(req: NextRequest) { return handler(req); }
export function POST(req: NextRequest) { return handler(req); }
