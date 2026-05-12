import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const subscription = await req.json();
  await db.updateSettings({ push_subscription: subscription });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await db.updateSettings({ push_subscription: null });
  return NextResponse.json({ ok: true });
}
