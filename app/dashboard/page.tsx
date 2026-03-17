"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgentState, ActivityItem, Classification, Email, Stats, Task } from "@/types";
import { AVATAR_COLORS, SEED_EMAILS } from "@/lib/data";
import { save, load } from "@/lib/storage";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import EmailCard from "@/components/EmailCard";
import Terminal, { TermLine } from "@/components/Terminal";
import ReviewModal from "@/components/ReviewModal";
import AddEmailModal from "@/components/AddEmailModal";
import ToastStack, { ToastItem } from "@/components/ToastStack";

function newId() { return Math.random().toString(36).slice(2, 10); }
function getTs() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
}

const INIT_LINES: TermLine[] = [
  { id: newId(), html: `<span style="color:#444">[init]</span> <span style="color:#f0a030">InboxPilot</span> booting...` },
  { id: newId(), html: `<span style="color:#444">[init]</span> Airia orchestrator <span style="color:#34d474">connected</span>` },
  { id: newId(), html: `<span style="color:#444">[init]</span> 5 agents <span style="color:#34d474">online</span> — Gmail · Notion · Slack` },
  { id: newId(), html: `<span style="color:#555">> Click "Run Pilot" to process all emails, or use per-email actions below</span>` },
];

export default function Dashboard() {
  const [emails, setEmails] = useState<Email[]>(SEED_EMAILS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [termLines, setTermLines] = useState<TermLine[]>(INIT_LINES);
  const [agents, setAgents] = useState<AgentState>({ classifier: "ready", reply: "ready", scheduler: "ready", task: "ready", notifier: "ready" });
  const [stats, setStats] = useState<Stats>({ processed: 0, timeSaved: 0, tasks: 0, replies: 0 });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [reviewEmailId, setReviewEmailId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeView, setActiveView] = useState("all");
  const [gmailConnected, setGmailConnected] = useState(false);

  const emailsRef = useRef<Email[]>(SEED_EMAILS);
  const updateEmails = (updater: (prev: Email[]) => Email[]) => {
    setEmails((prev) => { const next = updater(prev); emailsRef.current = next; return next; });
  };

  // Hydrate from localStorage after mount
  useEffect(() => {
    const savedEmails = load<Email[]>("emails", []);
    if (savedEmails.length > 0) {
      setEmails(savedEmails);
      emailsRef.current = savedEmails;
    }
    setTasks(load<Task[]>("tasks", []));
    setStats(load<Stats>("stats", { processed: 0, timeSaved: 0, tasks: 0, replies: 0 }));
    setActivity(load<ActivityItem[]>("activity", []));
    // Check Gmail connection
    fetch("/api/auth/gmail/status").then((r) => r.json()).then((d) => setGmailConnected(d.connected)).catch(() => {});
    // Handle OAuth callback redirect
    if (typeof window !== "undefined" && window.location.search.includes("gmail=connected")) {
      setGmailConnected(true);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  // Persist state changes
  useEffect(() => { save("emails", emails); }, [emails]);
  useEffect(() => { save("tasks", tasks); }, [tasks]);
  useEffect(() => { save("stats", stats); }, [stats]);
  useEffect(() => { save("activity", activity); }, [activity]);

  const addToast = useCallback((msg: string) => {
    const id = newId();
    setToasts((p) => [...p, { id, message: msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const addActivity = useCallback((icon: string, text: string) => {
    setActivity((p) => [{ id: newId(), icon, text, time: "just now" }, ...p].slice(0, 10));
  }, []);

  const addTerm = useCallback((html: string) => {
    setTermLines((p) => [...p, { id: newId(), html: `<span style="color:#444">[${getTs()}]</span> ${html}` }]);
  }, []);

  const setAgent = useCallback((key: keyof AgentState, state: "ready" | "busy" | "idle") => {
    setAgents((p) => ({ ...p, [key]: state }));
  }, []);

  const updateEmail = useCallback((id: string, patch: Partial<Email>) => {
    updateEmails((p) => p.map((e) => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const classifyEmail = useCallback(async (id: string) => {
    const em = emailsRef.current.find((e) => e.id === id);
    if (!em || em.processing) return;

    updateEmail(id, { processing: true });
    setAgent("classifier", "busy");
    addTerm(`<span style="color:#b060f0">Classifier</span> → analyzing <em style="color:#7a7a86">${em.subject.slice(0,50)}</em>`);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: em.sender, email: em.email, subject: em.subject, body: em.body }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`); }

      const cls: Classification = await res.json();
      updateEmail(id, { classification: cls, tags: cls.tags || [], processing: false });
      setStats((p) => ({ ...p, processed: p.processed + 1, timeSaved: p.timeSaved + 8 }));
      addActivity("🧠", `Classified: <strong>${em.sender}</strong> — <strong style="color:${cls.priority==="urgent"?"#f05050":cls.priority==="high"?"#f0a030":"#34d474"}">${cls.priority.toUpperCase()}</strong>`);
      addTerm(`<span style="color:#34d474">✓ Done</span> — priority: <span style="color:#f0a030">${cls.priority}</span> | tags: ${(cls.tags||[]).join(", ")||"none"}`);

      if (cls.has_task && cls.task_title) {
        setTasks((p) => [...p, { id: newId(), title: cls.task_title!, deadline: cls.task_deadline, from: em.sender, emailId: id, done: false }]);
        setStats((p) => ({ ...p, tasks: p.tasks + 1 }));
        setAgent("task", "busy");
        addActivity("✅", `Task: <strong>${cls.task_title}</strong>`);
        addTerm(`<span style="color:#b060f0">Task Agent</span> → syncing "<span style="color:#f0a030">${cls.task_title}</span>" to Notion...`);
        // Fire real Notion task creation — non-blocking, graceful fallback on failure
        fetch("/api/notion/task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cls.task_title,
            deadline: cls.task_deadline,
            from: em.sender,
            emailSubject: em.subject,
            priority: cls.priority,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              addTerm(`<span style="color:#34d474">✓ Notion</span> — task created <span style="color:#7a7a86">${d.id?.slice(0, 8)}</span>`);
            } else if (d.error?.includes("not configured")) {
              addTerm(`<span style="color:#555">Notion not configured — task saved locally only</span>`);
            } else {
              addTerm(`<span style="color:#f0a030">⚠ Notion — ${d.error}</span>`);
            }
          })
          .catch(() => addTerm(`<span style="color:#555">Notion unavailable — task saved locally</span>`));
        setTimeout(() => setAgent("task", "ready"), 1200);
        addToast(`✅ Task: "${cls.task_title}"`);
      }
      if (cls.notify_slack) {
        setAgent("notifier", "busy");
        addTerm(`<span style="color:#b060f0">Notifier</span> → sending Slack alert for <span style="color:#f05050">${cls.priority.toUpperCase()}</span>...`);
        addActivity("🔔", `Slack alert — <strong>${em.sender}</strong>`);
        // Fire real Slack webhook — non-blocking, graceful fallback on failure
        fetch("/api/slack/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: em.sender,
            subject: em.subject,
            priority: cls.priority,
            summary: cls.summary,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              addTerm(`<span style="color:#34d474">✓ Slack</span> — alert delivered`);
            } else if (d.error?.includes("not configured")) {
              addTerm(`<span style="color:#555">Slack not configured — alert logged only</span>`);
            } else {
              addTerm(`<span style="color:#f0a030">⚠ Slack — ${d.error}</span>`);
            }
          })
          .catch(() => addTerm(`<span style="color:#555">Slack unavailable — alert logged locally</span>`));
        setTimeout(() => setAgent("notifier", "ready"), 900);
        addToast(`🔔 Slack alerted for "${em.subject.slice(0,35)}"`);
      }
    } catch (err) {
      updateEmail(id, { processing: false });
      const msg = err instanceof Error ? err.message : "Unknown error";
      addTerm(`<span style="color:#f05050">✗ ERROR — ${msg}</span>`);
      addToast(`⚠ Classification failed: ${msg}`);
    }
    setAgent("classifier", "ready");
  }, [updateEmail, setAgent, addTerm, addActivity, addToast]);

  const draftReply = useCallback(async (id: string) => {
    const em = emailsRef.current.find((e) => e.id === id);
    if (!em || em.processing) return;

    updateEmail(id, { processing: true, draft: null });
    setAgent("reply", "busy");
    addTerm(`<span style="color:#b060f0">Reply Agent</span> → streaming for <em style="color:#7a7a86">${em.sender}</em>`);

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: em.sender, subject: em.subject, body: em.body, priority: em.classification?.priority }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        updateEmail(id, { draft: full });
      }
      updateEmail(id, { processing: false, draft: full });
      setStats((p) => ({ ...p, replies: p.replies + 1 }));
      addActivity("✍️", `Reply drafted for <strong>${em.sender}</strong>`);
      addTerm(`<span style="color:#34d474">✓ Draft ready</span> — ${full.length} chars — awaiting HITL approval`);
      addToast(`✍ Reply ready for ${em.sender}`);
      setReviewEmailId(id);
    } catch (err) {
      updateEmail(id, { processing: false });
      addTerm(`<span style="color:#f05050">✗ Reply error — ${err instanceof Error ? err.message : "Unknown"}</span>`);
      addToast("⚠ Reply generation failed");
    }
    setAgent("reply", "ready");
  }, [updateEmail, setAgent, addTerm, addActivity, addToast]);

  const sendReply = useCallback(async (id: string, draftText?: string) => {
    const em = emailsRef.current.find((e) => e.id === id);
    if (!em) return;

    if (gmailConnected) {
      try {
        addTerm(`<span style="color:#b060f0">Gmail</span> → sending reply to <span style="color:#f0a030">${em.email}</span>`);
        const res = await fetch("/api/gmail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: em.email, subject: `Re: ${em.subject}`, body: draftText || em.draft || "" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        addTerm(`<span style="color:#34d474">✓ Email sent via Gmail</span> to ${em.email}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown";
        addTerm(`<span style="color:#f05050">✗ Gmail send failed — ${msg}</span>`);
        addToast(`⚠ Gmail send failed: ${msg}`);
      }
    }

    updateEmail(id, { done: true, tags: [...(em.tags||[]).filter((t)=>t!=="done"), "done"] });
    setReviewEmailId(null);
    addActivity("✉️", `Reply sent to <strong>${em.sender}</strong>`);
    addTerm(`<span style="color:#34d474">✓ Reply sent</span> to ${em.email}`);
    addToast(`✉ Reply sent to ${em.sender}`);
  }, [updateEmail, addActivity, addTerm, addToast, gmailConnected]);

  const runPilot = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    addTerm(`<span style="color:#f0a030">━━━━━━ RUN PILOT ━━━━━━</span>`);
    const pending = emailsRef.current.filter((e) => !e.done && !e.processing);
    addTerm(`Processing <span style="color:#f0a030">${pending.length}</span> emails...`);
    for (const em of pending) { await classifyEmail(em.id); await new Promise((r) => setTimeout(r, 600)); }
    addTerm(`<span style="color:#f0a030">━━━━━━━━━━━━━━━━━━━━━━</span>`);
    addTerm(`<span style="color:#34d474">✅ Pilot complete</span>`);
    addToast("✅ Pilot complete — inbox processed!");
    setIsRunning(false);
  }, [isRunning, classifyEmail, addTerm, addToast]);

  const addEmail = useCallback((sender: string, email: string, subject: string, body: string) => {
    const initials = sender.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase();
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newEmail: Email = { id: newId(), sender, email: email || `${sender.toLowerCase().replace(/ /g,"")}@example.com`, subject, body, time: "Just now", color, initials, tags: [], classification: null, draft: null, done: false, processing: false };
    updateEmails((p) => [newEmail, ...p]);
    addActivity("📧", `Email added: <strong>${sender}</strong>`);
    addTerm(`<span style="color:#4f8ef7">+</span> Queued from <span style="color:#f0a030">${sender}</span>`);
    addToast(`📧 "${subject.slice(0,40)}" added`);
  }, [addActivity, addTerm, addToast]);

  const connectGmail = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/gmail");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      addToast("⚠ Failed to start Gmail connection");
    }
  }, [addToast]);

  const fetchGmail = useCallback(async () => {
    addTerm(`<span style="color:#b060f0">Gmail</span> → fetching inbox emails...`);
    try {
      const res = await fetch("/api/gmail/fetch");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fetched: Email[] = await res.json();
      if (fetched.length === 0) {
        addTerm(`<span style="color:#f0a030">No new emails found</span>`);
        addToast("No new emails in inbox");
        return;
      }
      updateEmails((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newOnes = fetched.filter((e) => !existingIds.has(e.id));
        return [...newOnes, ...prev];
      });
      addTerm(`<span style="color:#34d474">✓ Fetched ${fetched.length} emails</span> from Gmail inbox`);
      addActivity("📧", `Fetched <strong>${fetched.length}</strong> emails from Gmail`);
      addToast(`📧 ${fetched.length} emails fetched from Gmail`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      addTerm(`<span style="color:#f05050">✗ Gmail fetch failed — ${msg}</span>`);
      addToast(`⚠ Gmail fetch failed: ${msg}`);
    }
  }, [addTerm, addActivity, addToast]);

  const reviewEmail = emails.find((e) => e.id === reviewEmailId) || null;
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const VIEW_TITLES: Record<string, string> = {
    all: "Inbox Operations", urgent: "Urgent Emails", tasks: "Extracted Tasks",
    meetings: "Meeting Requests", drafts: "Draft Replies", analytics: "Analytics",
  };

  const filteredEmails = emails.filter((em) => {
    switch (activeView) {
      case "urgent":   return em.tags.includes("urgent");
      case "meetings": return em.classification?.has_meeting_request;
      case "drafts":   return !!em.draft && !em.done;
      default:         return true;
    }
  });

  return (
    <>
      <div className="grid h-screen overflow-hidden" style={{ gridTemplateColumns: "220px 1fr 300px", gridTemplateRows: "52px 1fr" }}>
        <Topbar onRunPilot={runPilot} onAddEmail={() => setShowAddModal(true)} isRunning={isRunning} gmailConnected={gmailConnected} onConnectGmail={connectGmail} onFetchGmail={fetchGmail} />
        <Sidebar emails={emails} tasks={tasks} agents={agents} activeView={activeView} onNavigate={setActiveView} />

        {/* Main */}
        <main className="overflow-y-auto bg-bg flex flex-col">

          {/* Page header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-border mb-5">
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight text-ink">{VIEW_TITLES[activeView] ?? "Inbox Operations"}</h1>
              <p className="text-[11px] text-muted mt-1">{todayStr}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-muted">Auto-pilot</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border border-emerald/30 bg-emerald/5 text-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block animate-[blink_2s_infinite]" />
                ON
              </div>
            </div>
          </div>

          {/* Stats */}
          {(activeView === "all" || activeView === "analytics") && (
            <div className="grid grid-cols-4 gap-2.5 px-6 mb-5">
              {[
                { label: "Processed", value: stats.processed, sub: "by AI agents", cls: "text-ink" },
                { label: "Time Saved", value: stats.timeSaved < 60 ? `${stats.timeSaved}m` : `${Math.floor(stats.timeSaved/60)}h ${stats.timeSaved%60}m`, sub: "estimated", cls: "text-emerald" },
                { label: "Tasks", value: stats.tasks, sub: "synced to Notion", cls: "text-violet" },
                { label: "Replies", value: stats.replies, sub: "drafted by AI", cls: "text-blue" },
              ].map((s) => (
                <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-[9px] uppercase tracking-[1px] text-dim mb-2">{s.label}</p>
                  <p className={`font-display text-[28px] font-bold tracking-tight ${s.cls}`}>{s.value}</p>
                  <p className="text-[9px] text-muted mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tasks view */}
          {activeView === "tasks" ? (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm text-ink">All Tasks</h2>
                <span className="text-[11px] text-muted">
                  {tasks.filter((t) => !t.done).length} pending · {tasks.filter((t) => t.done).length} done
                </span>
              </div>
              {tasks.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[32px] mb-3">✅</p>
                  <p className="text-sm text-muted">No tasks yet. Classify emails to extract tasks.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface animate-[slideUp_0.25s_ease_both]">
                      <button
                        onClick={() => setTasks((p) => p.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))}
                        className={`w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all border
                          ${task.done ? "bg-emerald border-emerald text-black" : "border-border2 bg-transparent"}`}
                      >
                        {task.done ? "✓" : ""}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${task.done ? "text-muted line-through" : "text-ink"}`}>{task.title}</p>
                        <p className="text-[10px] text-dim mt-1">
                          From: <span className="text-muted">{task.from}</span>
                          {task.deadline && <span className="text-amber"> · Due: {task.deadline}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : activeView === "analytics" ? (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-[9px] uppercase tracking-[1px] text-dim mb-3">Priority Breakdown</p>
                  {(() => {
                    const priorities = ["urgent", "high", "normal", "low", "spam"] as const;
                    const counts = priorities.map((p) => emails.filter((e) => e.classification?.priority === p).length);
                    const total = counts.reduce((a, b) => a + b, 0) || 1;
                    const colors = { urgent: "#f05050", high: "#f0a030", normal: "#34d474", low: "#4f8ef7", spam: "#555" };
                    // Donut chart via SVG
                    const r = 36; const cx = 50; const cy = 50; const stroke = 14;
                    const circumference = 2 * Math.PI * r;
                    let offset = 0;
                    const segments = priorities.map((p, i) => {
                      const pct = counts[i] / total;
                      const dash = pct * circumference;
                      const gap = circumference - dash;
                      const rotate = (offset / total) * 360 - 90;
                      offset += counts[i];
                      return { p, count: counts[i], pct, dash, gap, rotate, color: colors[p] };
                    }).filter((s) => s.count > 0);
                    return (
                      <div className="flex items-center gap-4">
                        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
                          {total === 1 ? (
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth={stroke} />
                          ) : (
                            segments.map((s) => (
                              <circle key={s.p} cx={cx} cy={cy} r={r} fill="none"
                                stroke={s.color} strokeWidth={stroke}
                                strokeDasharray={`${s.dash} ${s.gap}`}
                                strokeDashoffset={0}
                                transform={`rotate(${s.rotate} ${cx} ${cy})`}
                              />
                            ))
                          )}
                          <text x={cx} y={cy - 5} textAnchor="middle" fill="#e0e0e0" fontSize="14" fontWeight="bold">{emails.filter((e) => e.classification).length}</text>
                          <text x={cx} y={cy + 9} textAnchor="middle" fill="#555" fontSize="7">classified</text>
                        </svg>
                        <div className="flex flex-col gap-1.5 flex-1">
                          {priorities.map((p, i) => (
                            <div key={p} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[p] }} />
                              <span className="text-[10px] text-muted capitalize w-12">{p}</span>
                              <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((counts[i] / total) * 100)}%`, background: colors[p] }} />
                              </div>
                              <span className="text-[10px] text-dim w-4 text-right">{counts[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-[9px] uppercase tracking-[1px] text-dim mb-3">Email Status</p>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[10px] text-muted w-20">Classified</span>
                    <span className="font-display text-lg font-bold text-ink">{emails.filter((e) => e.classification).length}</span>
                    <span className="text-[10px] text-dim">/ {emails.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[10px] text-muted w-20">Replied</span>
                    <span className="font-display text-lg font-bold text-violet">{emails.filter((e) => !!e.draft).length}</span>
                    <span className="text-[10px] text-dim">/ {emails.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[10px] text-muted w-20">Done</span>
                    <span className="font-display text-lg font-bold text-emerald">{emails.filter((e) => e.done).length}</span>
                    <span className="text-[10px] text-dim">/ {emails.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-muted w-20">Tasks</span>
                    <span className="font-display text-lg font-bold text-amber">{tasks.length}</span>
                    <span className="text-[10px] text-dim">extracted</span>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <>
              <div className="flex items-center justify-between px-6 mb-3">
                <h2 className="font-display font-semibold text-sm text-ink">
                  {activeView === "all" ? "Email Queue" : `${VIEW_TITLES[activeView]} Queue`}
                </h2>
                <span className="text-[11px] text-muted">
                  {filteredEmails.filter((e) => !e.done).length} pending · {filteredEmails.filter((e) => e.done).length} done
                </span>
              </div>

              <div className="flex flex-col gap-2 px-6 pb-6">
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-[32px] mb-3">📭</p>
                    <p className="text-sm text-muted">No emails match this filter. Classify emails first or switch to All Mail.</p>
                  </div>
                ) : (
                  filteredEmails.map((em, i) => (
                    <EmailCard
                      key={em.id}
                      email={em}
                      index={i}
                      onClassify={classifyEmail}
                      onDraftReply={draftReply}
                      onReview={(id) => setReviewEmailId(id)}
                      onMarkDone={(id) => updateEmail(id, { done: true })}
                    />
                  ))
                )}
              </div>
            </>
          )}

          <p className="text-[9px] uppercase tracking-[1.2px] text-dim px-6 mb-2">Agent Log</p>
          <Terminal lines={termLines} />
        </main>

        <RightPanel
          onRunPilot={runPilot}
          isRunning={isRunning}
          activity={activity}
          tasks={tasks}
          stats={stats}
          onToggleTask={(id) => setTasks((p) => p.map((t) => t.id === id ? { ...t, done: !t.done } : t))}
        />
      </div>

      {reviewEmail && (
        <ReviewModal
          email={reviewEmail}
          onClose={() => setReviewEmailId(null)}
          onSend={sendReply}
          onRegenerate={(id) => { setReviewEmailId(null); draftReply(id); }}
        />
      )}
      {showAddModal && <AddEmailModal onClose={() => setShowAddModal(false)} onAdd={addEmail} />}
      <ToastStack toasts={toasts} />
    </>
  );
}
