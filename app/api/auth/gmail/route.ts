import { getAuthUrl } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[gmail auth] Error:", err);
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 });
  }
}
