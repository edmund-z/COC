import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getLocalDate } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { choice, why_word, date: dateOverride } = body;

  if (choice !== "create" && choice !== "consume") {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const settings = await db.fetchSettings();
  const todayStr = getLocalDate(settings.timezone);
  const date =
    typeof dateOverride === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateOverride)
      ? dateOverride
      : todayStr;

  if (date > todayStr) {
    return NextResponse.json({ error: "Cannot log future dates" }, { status: 400 });
  }

  const existing = await db.getEntryForDate(date);
  if (existing) {
    return NextResponse.json({ error: "Already logged" }, { status: 409 });
  }

  await db.insertEntry(date, choice, why_word ?? undefined);
  return NextResponse.json({ ok: true });
}
