"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoMark from "@/components/LogoMark";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Invalid credentials");
        setLoading(false);
        return;
      }
      router.push(from);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("demo@inboxpilot.ai");
    setPassword("inboxpilot2025");
  }

  return (
    <div className="relative w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 mb-4 shadow-[0_0_32px_rgba(240,160,48,0.15)]">
          <LogoMark size={32} />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">InboxPilot</h1>
        <p className="text-sm text-muted mt-1">AI-powered email triage dashboard</p>
      </div>

      {/* Card */}
      <div className="bg-surface border border-border rounded-2xl p-7 shadow-xl">
        <h2 className="font-display text-[15px] font-semibold text-ink mb-5">Sign in to your workspace</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-[1px] text-dim block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@inboxpilot.ai"
              required
              className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-dim outline-none focus:border-amber transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[1px] text-dim block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-dim outline-none focus:border-amber transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-rose bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-black font-semibold text-sm rounded-xl py-2.5 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer mt-1"
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-[10px] text-dim text-center mb-2">Demo credentials</p>
          <div className="bg-surface2 rounded-lg px-3 py-2.5 font-mono text-[10px] text-muted">
            <div className="flex justify-between"><span className="text-dim">email</span><span>demo@inboxpilot.ai</span></div>
            <div className="flex justify-between mt-1"><span className="text-dim">password</span><span>inboxpilot2025</span></div>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="w-full mt-2 text-[10px] text-amber hover:text-amber/80 py-1 transition-colors cursor-pointer"
          >
            Fill demo credentials
          </button>
        </div>
      </div>

      <p className="text-[10px] text-dim text-center mt-5">
        Built for the Airia AI Agent Challenge
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }}
      />
      <Suspense fallback={<div className="text-dim text-sm">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
