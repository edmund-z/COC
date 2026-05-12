import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { parseSmsChoice, twilioXml } from "@/lib/twilio";
import { computeStreak } from "@/lib/streak";
import { getLocalDate } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = (formData.get("Body") as string) ?? "";

  const choice = parseSmsChoice(body);

  if (!choice) {
    return new NextResponse(twilioXml("Reply C or X."), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const settings = await db.fetchSettings();
  const today = getLocalDate(settings.timezone);

  const existing = await db.getEntryForDate(today);
  if (existing) {
    const allEntries = await db.getAllEntries();
    const streak = computeStreak(allEntries);
    const label = existing.choice === "create" ? "CREATE" : "CONSUME";
    return new NextResponse(
      twilioXml(`Already logged: ${label}. Streak: ${streak}.`),
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  await db.insertEntry(today, choice);
  const allEntries = await db.getAllEntries();
  const streak = computeStreak(allEntries);
  const label = choice === "create" ? "CREATE" : "CONSUME";

  return new NextResponse(
    twilioXml(`Logged: ${label}. Streak: ${streak}.`),
    { headers: { "Content-Type": "text/xml" } }
  );
}
