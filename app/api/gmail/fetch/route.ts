import { fetchEmails, isGmailConnected } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!isGmailConnected()) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 401 });
    }

    const emails = await fetchEmails(10);
    return NextResponse.json(emails);
  } catch (err) {
    console.error("[gmail fetch] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch emails: ${msg}` }, { status: 500 });
  }
}
