import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InboxPilot — Autonomous Email Agent",
  description: "AI-powered multi-agent email operations built on Airia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-bg text-ink font-mono">{children}</body>
    </html>
  );
}
