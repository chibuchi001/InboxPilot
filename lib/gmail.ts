import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const TOKENS_PATH = join(process.cwd(), ".gmail-tokens.json");
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getCredentials() {
  return {
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    redirectUri: process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/auth/gmail/callback",
  };
}

export function getAuthUrl(): string {
  const { clientId, redirectUri } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getCredentials();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return await res.json();
}

export function saveTokens(tokens: Record<string, unknown>): void {
  writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export function loadTokens(): Record<string, unknown> | null {
  if (!existsSync(TOKENS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function isGmailConnected(): boolean {
  const tokens = loadTokens();
  return !!(tokens && tokens.refresh_token);
}

async function getAccessToken(): Promise<string> {
  const tokens = loadTokens();
  if (!tokens) throw new Error("Gmail not connected");

  // Check if token is expired (with 60s buffer)
  const expiryDate = tokens.expiry_date as number | undefined;
  if (expiryDate && Date.now() > expiryDate - 60000) {
    // Refresh the token
    const { clientId, clientSecret } = getCredentials();
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token as string,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error("Failed to refresh token");
    const refreshed = await res.json();
    const updated = {
      ...tokens,
      access_token: refreshed.access_token,
      expiry_date: Date.now() + (refreshed.expires_in || 3600) * 1000,
    };
    saveTokens(updated);
    return refreshed.access_token;
  }

  return tokens.access_token as string;
}

async function gmailApi(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${err}`);
  }
  return res.json();
}

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
  return { name: from.split("@")[0], email: from };
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

interface MessagePart {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
}

function getMessageBody(payload: MessagePart): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64Url(textPart.body.data);
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = getMessageBody(part);
        if (nested) return nested;
      }
    }
  }
  return "";
}

const AVATAR_COLORS = ["#7c3aed", "#dc2626", "#0284c7", "#059669", "#b45309", "#0f766e", "#9333ea", "#c2410c"];

export async function fetchEmails(maxResults = 10) {
  const list = await gmailApi(`messages?maxResults=${maxResults}&q=${encodeURIComponent("in:inbox")}`);
  const messages: { id: string }[] = list.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const full = await gmailApi(`messages/${msg.id}?format=full`);
      const headers = full.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: { name: string; value: string }) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const fromRaw = getHeader("From");
      const { name, email } = parseFromHeader(fromRaw);
      const subject = getHeader("Subject");
      const dateStr = getHeader("Date");
      const body = getMessageBody(full.payload);

      const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
      const color = AVATAR_COLORS[Math.abs(name.charCodeAt(0)) % AVATAR_COLORS.length];

      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const time = diffMin < 1 ? "Just now" : diffMin < 60 ? `${diffMin}m ago` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago` : date.toLocaleDateString();

      return {
        id: msg.id,
        sender: name,
        email,
        subject,
        body: body.slice(0, 2000),
        time,
        color,
        initials,
        tags: [] as string[],
        classification: null,
        draft: null,
        done: false,
        processing: false,
      };
    }),
  );

  return emails;
}

export async function sendEmail(to: string, subject: string, body: string) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const encoded = Buffer.from(message).toString("base64url");

  const result = await gmailApi("messages/send", {
    method: "POST",
    body: JSON.stringify({ raw: encoded }),
  });

  return result;
}

export async function getConnectedEmail(): Promise<string | null> {
  try {
    const token = await getAccessToken();
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email || null;
  } catch {
    return null;
  }
}
