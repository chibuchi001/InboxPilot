import { sendSlackAlert, isSlackConfigured, SlackAlertInput } from "@/lib/slack";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isSlackConfigured()) {
    return NextResponse.json({ error: "Slack is not configured" }, { status: 503 });
  }

  let body: SlackAlertInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sender, subject, priority, summary } = body;
  if (!sender || !subject || !priority) {
    return NextResponse.json({ error: "Missing required fields: sender, subject, priority" }, { status: 400 });
  }

  try {
    await sendSlackAlert({ sender, subject, priority, summary });
    console.log(`[slack] Alert sent for: ${subject}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[slack] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Slack alert failed: ${msg}` }, { status: 500 });
  }
}
