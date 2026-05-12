import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "0");
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  if (!year || !month) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }
  const entries = await db.getEntriesForMonth(year, month);
  return NextResponse.json({ entries });
}
