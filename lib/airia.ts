const AIRIA_API_KEY = process.env.AIRIA_API_KEY || "";
const AIRIA_ORCHESTRATOR_ID = process.env.AIRIA_ORCHESTRATOR_ID || "";
const AIRIA_CLASSIFY_PIPELINE_ID = process.env.AIRIA_CLASSIFY_PIPELINE_ID || "";
const AIRIA_REPLY_PIPELINE_ID = process.env.AIRIA_REPLY_PIPELINE_ID || "";

export function isAiriaConfigured(): boolean {
  return !!(AIRIA_API_KEY && (AIRIA_ORCHESTRATOR_ID || AIRIA_CLASSIFY_PIPELINE_ID));
}

interface AiriaInput {
  sender: string;
  email?: string;
  subject: string;
  body: string;
  priority?: string;
}

// Helper: call any Airia pipeline by ID
async function callAiriaPipeline(pipelineId: string, userInput: string) {
  const res = await fetch(
    `https://api.airia.ai/v2/PipelineExecution/${pipelineId}`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": AIRIA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userInput,
        asyncOutput: false,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Airia pipeline failed: ${res.status} ${text}`);
  }

  return res;
}

// Format email data into the text format the Airia agents expect
function formatEmailInput(input: AiriaInput): string {
  return `FROM: ${input.sender} <${input.email || "unknown@email.com"}>
SUBJECT: ${input.subject}
${input.priority ? `PRIORITY: ${input.priority}\n` : ""}BODY:
${input.body}`;
}

// Run the full orchestrator (classify + reply in one call)
export async function executeOrchestratorPipeline(input: AiriaInput) {
  const pipelineId = AIRIA_ORCHESTRATOR_ID;
  if (!pipelineId) throw new Error("AIRIA_ORCHESTRATOR_ID not configured");

  const res = await callAiriaPipeline(pipelineId, formatEmailInput(input));
  const data = await res.json();
  return data.output || data.result || data;
}

// Run classify pipeline separately (uses dedicated classifier agent)
export async function executeClassifyPipeline(input: AiriaInput) {
  const pipelineId = AIRIA_CLASSIFY_PIPELINE_ID || AIRIA_ORCHESTRATOR_ID;
  if (!pipelineId) throw new Error("No classify pipeline ID configured");

  const res = await callAiriaPipeline(pipelineId, formatEmailInput(input));
  const data = await res.json();

  // Try to parse JSON from the response
  const raw = data.output || data.result || data;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw.replace(/```json\n?|```\n?/g, "").trim());
    } catch {
      return raw;
    }
  }
  return raw;
}

// Run reply pipeline separately (uses dedicated reply agent)
export async function executeReplyPipeline(input: AiriaInput): Promise<Response> {
  const pipelineId = AIRIA_REPLY_PIPELINE_ID || AIRIA_ORCHESTRATOR_ID;
  if (!pipelineId) throw new Error("No reply pipeline ID configured");

  return await callAiriaPipeline(pipelineId, formatEmailInput(input));
}