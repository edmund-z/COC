import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscription = await req.json();
  await db.updateSettings({ push_subscription: subscription });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db.updateSettings({ push_subscription: null });
  return NextResponse.json({ ok: true });
}
