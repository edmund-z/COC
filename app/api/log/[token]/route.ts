import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { computeStreak } from "@/lib/streak";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { choice, why_word } = await req.json();

  if (choice !== "create" && choice !== "consume") {
    return NextResponse.json({ error: "Invalid choice." }, { status: 400 });
  }

  const tokenRow = await db.getToken(token).catch(() => null);
  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid token." }, { status: 404 });
  }
  if (tokenRow.used) {
    return NextResponse.json({ error: "Token already used." }, { status: 409 });
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired." }, { status: 410 });
  }

  const existing = await db.getEntryForDate(tokenRow.date);
  if (existing) {
    return NextResponse.json({ error: "Already logged for today." }, { status: 409 });
  }

  await db.insertEntry(tokenRow.date, choice, why_word ?? undefined);
  await db.markTokenUsed(token);

  const allEntries = await db.getAllEntries();
  const streak = computeStreak(allEntries);

  return NextResponse.json({ ok: true, streak });
}
