"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoMark from "@/components/LogoMark";

interface TopbarProps {
  onRunPilot: () => void;
  onAddEmail: () => void;
  isRunning: boolean;
  gmailConnected: boolean;
  onConnectGmail: () => void;
  onFetchGmail: () => void;
}

export default function Topbar({ onRunPilot, onAddEmail, isRunning, gmailConnected, onConnectGmail, onFetchGmail }: TopbarProps) {
  const router = useRouter();
  const [time, setTime] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <header className="col-span-3 flex items-center gap-3 px-5 border-b border-border bg-bg/95 backdrop-blur-lg sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 font-display font-extrabold text-[17px] tracking-tight text-ink shrink-0">
        <div className="w-8 h-8 rounded-[8px] bg-amber/10 border border-amber/20 flex items-center justify-center">
          <LogoMark size={22} />
        </div>
        InboxPilot
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Live pill */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border border-emerald/30 bg-emerald/5 text-emerald shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block animate-[blink_2s_infinite]" />
        Agents Live
      </div>

      {/* Integration chips */}
      <div className="flex gap-1.5">
        {gmailConnected ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-medium uppercase tracking-wide border border-emerald/30 bg-emerald/5 text-emerald">
            <span className="w-1 h-1 rounded-full bg-emerald inline-block" />
            Gmail
          </div>
        ) : (
          <button
            onClick={onConnectGmail}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-medium uppercase tracking-wide border border-blue/30 bg-blue/5 text-blue hover:bg-blue/10 cursor-pointer transition-all"
          >
            <span className="w-1 h-1 rounded-full bg-dim inline-block" />
            Connect Gmail
          </button>
        )}
        {gmailConnected && (
          <button
            onClick={onFetchGmail}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-medium uppercase tracking-wide border border-violet/30 bg-violet/5 text-violet hover:bg-violet/10 cursor-pointer transition-all"
          >
            Fetch Inbox
          </button>
        )}
        {["Notion", "Slack", "Airia"].map((name) => (
          <div
            key={name}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-medium uppercase tracking-wide border border-amber/20 bg-amber/5 text-amber"
          >
            <span className="w-1 h-1 rounded-full bg-emerald inline-block" />
            {name}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-[10px] text-dim font-mono tabular-nums">{time}</span>
        <div className="w-px h-5 bg-border" />

        <button
          onClick={onAddEmail}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wide border border-border2 text-muted hover:text-ink hover:bg-surface2 transition-all cursor-pointer"
        >
          + Add Email
        </button>

        <button
          onClick={onRunPilot}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border border-amber bg-amber text-black transition-all cursor-pointer
            ${isRunning ? "opacity-60 cursor-not-allowed" : "hover:brightness-105"}`}
        >
          {isRunning ? (
            <><span className="inline-block animate-[spin_0.75s_linear_infinite]">⟳</span> Running…</>
          ) : (
            "▶ Run Pilot"
          )}
        </button>

        <div className="w-px h-5 bg-border" />
        <button
          onClick={handleLogout}
          className="text-[10px] text-dim hover:text-muted transition-colors cursor-pointer font-mono uppercase tracking-wide"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
