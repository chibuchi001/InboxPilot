import { exchangeCode, saveTokens } from "@/lib/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const tokens = await exchangeCode(code);
    saveTokens(tokens);

    // Redirect back to the dashboard with success indicator
    return NextResponse.redirect(new URL("/dashboard?gmail=connected", req.nextUrl.origin));
  } catch (err) {
    console.error("[gmail callback] Error:", err);
    return NextResponse.redirect(new URL("/dashboard?gmail=error", req.nextUrl.origin));
  }
}
