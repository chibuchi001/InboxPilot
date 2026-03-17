import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, makeSessionToken, checkRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Rate-limit by IP: max 10 attempts per 15 minutes
  // x-real-ip is set by Vercel/Nginx and is not spoofable;
  // fall back to the first entry of x-forwarded-for.
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  const expectedEmail = process.env.DEMO_EMAIL;
  const expectedPassword = process.env.DEMO_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!expectedEmail || !expectedPassword || !secret) {
    console.error("[login] Missing required env vars: DEMO_EMAIL, DEMO_PASSWORD, AUTH_SECRET");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let email: string | undefined;
  let password: string | undefined;
  try {
    const body = await req.json();
    email = body?.email;
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    email?.toLowerCase().trim() !== expectedEmail.toLowerCase() ||
    password !== expectedPassword
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await makeSessionToken(expectedEmail, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
