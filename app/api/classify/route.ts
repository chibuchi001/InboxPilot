import { groq } from "@/lib/groq";
import { isAiriaConfigured, executeClassifyPipeline } from "@/lib/airia";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sender, email, subject, body } = await req.json();

    if (!sender || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Route through Airia orchestrator when configured, otherwise direct Groq
    if (isAiriaConfigured()) {
      console.log("[classify] Routing through Airia orchestrator");
      const result = await executeClassifyPipeline({ sender, email, subject, body });
      return NextResponse.json(result);
    }

    console.log("[classify] Using direct Groq LLM");
    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are an expert email classifier for busy professionals.
Analyze the email and respond with ONLY a valid JSON object. No markdown, no explanation, no backticks.
Return exactly this structure:
{
  "priority": "urgent or high or normal or low or spam",
  "tags": ["array of applicable tags from: urgent, high, meeting, task, action, fyi"],
  "requires_reply": true or false,
  "has_meeting_request": true or false,
  "has_task": true or false,
  "task_title": "short actionable task title if has_task is true, otherwise null",
  "task_deadline": "human-readable deadline like Today, Friday, Monday, Next week, or null",
  "summary": "one sentence summary of the email under 20 words",
  "notify_slack": true or false
}
Only set notify_slack to true for urgent or high priority emails requiring immediate action.
Only include relevant tags. Spam and newsletters should have low priority.`,
        },
        {
          role: "user",
          content: `FROM: ${sender} <${email || "unknown@email.com"}>\nSUBJECT: ${subject}\nBODY:\n${body}`,
        },
      ],
    });

    const raw = message.choices?.[0]?.message?.content || "";
    if (!raw) {
      return NextResponse.json({ error: "Empty response from AI model" }, { status: 502 });
    }
    const clean = raw.replace(/```json\n?|```\n?/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch {
      console.error("[classify] Failed to parse AI response as JSON:", clean);
      return NextResponse.json({ error: "AI returned malformed JSON" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[classify] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Classification failed: ${msg}` }, { status: 500 });
  }
}
