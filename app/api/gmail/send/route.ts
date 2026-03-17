import { sendEmail, isGmailConnected } from "@/lib/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!isGmailConnected()) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 401 });
    }

    const { to, subject, body } = await req.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields (to, subject, body)" }, { status: 400 });
    }

    const result = await sendEmail(to, subject, body);
    return NextResponse.json({ success: true, messageId: result.id });
  } catch (err) {
    console.error("[gmail send] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to send email: ${msg}` }, { status: 500 });
  }
}
