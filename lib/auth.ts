import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "coc_session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function sign(value: string): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET not set");
  const hmac = createHmac("sha256", secret);
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const expected = sign(value);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signed);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return value;
  } catch {
    return null;
  }
}

export function makeSessionCookie(): {
  name: string;
  value: string;
  options: Record<string, unknown>;
} {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) throw new Error("ACCESS_PASSWORD not set");
  const value = sign(`auth:${Date.now()}`);
  return {
    name: COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ONE_YEAR_MS / 1000,
      path: "/",
    },
  };
}

export function isAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) return false;
  return verify(cookie.value) !== null;
}

export async function isAuthenticatedServer(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return false;
  return verify(cookie.value) !== null;
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    options: { maxAge: 0, path: "/" },
  };
}
