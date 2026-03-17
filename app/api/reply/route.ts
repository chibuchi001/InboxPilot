import { groq } from "@/lib/groq";
import { isAiriaConfigured, executeReplyPipeline } from "@/lib/airia";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sender, subject, body, priority } = await req.json();

    if (!sender || !subject || !body) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Route through Airia orchestrator when configured
    if (isAiriaConfigured()) {
      console.log("[reply] Routing through Airia orchestrator");
      const airiaRes = await executeReplyPipeline({ sender, subject, body, priority });
      return new Response(airiaRes.body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }

    console.log("[reply] Using direct Groq LLM");
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 320,
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a professional email assistant helping a busy executive.
Write a concise, warm, professional reply to the email below.
Rules:
- Under 130 words total
- Start directly with the greeting (Hi [name], or Dear [name],)
- No subject line, no preamble, no explanation of what you're doing
- Match the urgency: urgent emails get direct, action-oriented replies
- End with a professional sign-off using only "Best," on its own line followed by a blank line (no name — the user will personalise)
- Be specific and actionable, not vague`,
        },
        {
          role: "user",
          content: `Write a reply to this email:

FROM: ${sender}
SUBJECT: ${subject}
PRIORITY: ${priority || "normal"}

EMAIL BODY:
${body}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices?.[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[reply] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Reply generation failed: ${msg}`, { status: 500 });
  }
}
