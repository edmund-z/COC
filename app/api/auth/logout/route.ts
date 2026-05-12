import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const { name, value, options } = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
  return res;
}
