const NOTION_TOKEN = process.env.NOTION_TOKEN || "";
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

export function isNotionConfigured(): boolean {
  return !!(NOTION_TOKEN && NOTION_DATABASE_ID);
}

export interface NotionTaskInput {
  title: string;
  deadline: string | null;
  from: string;
  emailSubject: string;
  priority: string;
}

export async function createNotionTask(task: NotionTaskInput): Promise<{ id: string; url: string }> {
  const properties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: task.title } }],
    },
    Status: {
      select: { name: "Not started" },
    },
    Source: {
      rich_text: [{ text: { content: `Email from ${task.from}: ${task.emailSubject}` } }],
    },
    Priority: {
      select: { name: task.priority.charAt(0).toUpperCase() + task.priority.slice(1) },
    },
  };

  if (task.deadline) {
    // Convert human-readable deadline to a best-effort ISO date
    const today = new Date();
    let date: Date | null = null;

    const lower = task.deadline.toLowerCase();
    if (lower === "today") {
      date = today;
    } else if (lower === "tomorrow") {
      date = new Date(today);
      date.setDate(today.getDate() + 1);
    } else if (lower === "next week") {
      date = new Date(today);
      date.setDate(today.getDate() + 7);
    } else if (["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].includes(lower)) {
      const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      const target = days.indexOf(lower);
      const current = today.getDay();
      const diff = (target - current + 7) % 7 || 7;
      date = new Date(today);
      date.setDate(today.getDate() + diff);
    }

    if (date) {
      properties["Due Date"] = { date: { start: date.toISOString().split("T")[0] } };
    }
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Notion API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { id: data.id, url: data.url };
}
