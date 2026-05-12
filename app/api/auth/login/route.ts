import { NextRequest, NextResponse } from "next/server";
import { makeSessionCookie, checkPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, value, options } = makeSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
  return res;
}
