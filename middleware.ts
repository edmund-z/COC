import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "coc_session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/sms/inbound",
  "/api/cron/send-sms",
  "/api/cron/auto-default",
  "/api/cron/weekly-summary",
  "/api/streak",
];

async function checkCookie(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) return false;
  const signed = cookie.value;
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const secret = process.env.COOKIE_SECRET;
  if (!secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(
      sig.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(value)
    );
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  if (!(await checkCookie(req))) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
