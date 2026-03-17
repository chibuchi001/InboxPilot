import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("[groq] GROQ_API_KEY is not set — AI features will fail at runtime.");
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
