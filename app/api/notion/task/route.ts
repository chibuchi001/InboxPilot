import { createNotionTask, isNotionConfigured, NotionTaskInput } from "@/lib/notion";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isNotionConfigured()) {
    return NextResponse.json({ error: "Notion is not configured" }, { status: 503 });
  }

  let body: NotionTaskInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, deadline, from, emailSubject, priority } = body;
  if (!title || !from || !emailSubject || !priority) {
    return NextResponse.json({ error: "Missing required fields: title, from, emailSubject, priority" }, { status: 400 });
  }

  try {
    const result = await createNotionTask({ title, deadline: deadline ?? null, from, emailSubject, priority });
    console.log(`[notion] Task created: ${result.id}`);
    return NextResponse.json({ success: true, id: result.id, url: result.url });
  } catch (err) {
    console.error("[notion] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Notion task creation failed: ${msg}` }, { status: 500 });
  }
}
