const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

export function isSlackConfigured(): boolean {
  return !!SLACK_WEBHOOK_URL;
}

export interface SlackAlertInput {
  sender: string;
  subject: string;
  priority: string;
  summary?: string;
}

const PRIORITY_EMOJI: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  normal: "🟡",
  low: "🟢",
  spam: "⚪",
};

export async function sendSlackAlert(input: SlackAlertInput): Promise<void> {
  const emoji = PRIORITY_EMOJI[input.priority] ?? "📧";
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} InboxPilot — ${input.priority.toUpperCase()} Email Alert`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*From:*\n${input.sender}` },
        { type: "mrkdwn", text: `*Priority:*\n${input.priority.toUpperCase()}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Subject:*\n${input.subject}` },
    },
  ];

  if (input.summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Summary:*\n${input.summary}` },
    });
  }

  blocks.push({
    type: "context",
    // @ts-expect-error Slack block kit context elements use 'elements', not 'text'/'fields'
    elements: [{ type: "mrkdwn", text: "Sent by InboxPilot · <http://localhost:3000/dashboard|Open Dashboard>" }],
  });

  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Slack webhook error (${res.status}): ${err}`);
  }
}
