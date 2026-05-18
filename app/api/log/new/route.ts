import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { generateToken } from "@/lib/token";
import { getLocalDate } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const settings = await db.fetchSettings();
  const todayStr = getLocalDate(settings.timezone);
  const date = (body.date as string) ?? todayStr;

  if (date > todayStr) {
    return NextResponse.json({ error: "Cannot log future dates" }, { status: 400 });
  }

  const existing = await db.getEntryForDate(date);
  if (existing) {
    return NextResponse.json({ error: "Already logged" }, { status: 409 });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.insertToken(token, date, expiresAt);

  return NextResponse.json({ path: `/log/${token}` });
}
