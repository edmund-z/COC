import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { computeStreak } from "@/lib/streak";

// Simple in-memory rate limit: max 60 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const allEntries = await db.getAllEntries();
  const streak = computeStreak(allEntries);

  return NextResponse.json(
    { streak, total_entries: allEntries.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60",
      },
    }
  );
}
