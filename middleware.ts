import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/api/sms/inbound",
  "/api/cron/send-sms",
  "/api/cron/auto-default",
  "/api/cron/weekly-summary",
  "/api/streak",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  if (!isAuthenticated(req)) {
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
