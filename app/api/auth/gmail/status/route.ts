import { isGmailConnected, getConnectedEmail } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connected = isGmailConnected();
    let email: string | null = null;
    if (connected) {
      email = await getConnectedEmail();
    }
    return NextResponse.json({ connected, email });
  } catch {
    return NextResponse.json({ connected: false, email: null });
  }
}
