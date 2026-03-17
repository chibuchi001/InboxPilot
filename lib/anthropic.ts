import Groq from "groq-sdk";
import { readFileSync } from "fs";
import { join } from "path";

function resolveApiKey(): string {
  const envKey = process.env.GROQ_API_KEY || "";
  if (envKey.startsWith("gsk_")) return envKey;

  // System env var may be missing — read .env files directly as fallback.
  for (const file of [".env", ".env.local", ".env.example"]) {
    try {
      const raw = readFileSync(join(process.cwd(), file), "utf8");
      const m = raw.match(/^GROQ_API_KEY=(.+)$/m);
      if (m && m[1].trim().startsWith("gsk_")) return m[1].trim();
    } catch {}
  }

  return envKey;
}

export const groq = new Groq({ apiKey: resolveApiKey() });
