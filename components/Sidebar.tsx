"use client";

import { AgentState, Email, Task } from "@/types";

interface SidebarProps {
  emails: Email[];
  tasks: Task[];
  agents: AgentState;
  activeView: string;
  onNavigate: (key: string) => void;
}

const NAV = [
  { icon: "📥", label: "All Mail",  key: "all" },
  { icon: "🔴", label: "Urgent",    key: "urgent" },
  { icon: "✅", label: "Tasks",     key: "tasks" },
  { icon: "📅", label: "Meetings",  key: "meetings" },
  { icon: "✉️", label: "Drafts",    key: "drafts" },
  { icon: "📊", label: "Analytics", key: "analytics" },
];

const AGENTS = [
  { key: "classifier", label: "Classifier", icon: "🧠" },
  { key: "reply",      label: "Reply Agent", icon: "✍️" },
  { key: "scheduler",  label: "Scheduler",  icon: "📅" },
  { key: "task",       label: "Task Agent", icon: "✅" },
  { key: "notifier",   label: "Notifier",   icon: "🔔" },
] as const;

export default function Sidebar({ emails, tasks, agents, activeView, onNavigate }: SidebarProps) {
  const counts: Record<string, number> = {
    all:      emails.filter((e) => !e.done).length,
    urgent:   emails.filter((e) => e.tags.includes("urgent")).length,
    tasks:    tasks.filter((t) => !t.done).length,
    meetings: emails.filter((e) => e.classification?.has_meeting_request).length,
    drafts:   emails.filter((e) => !!e.draft && !e.done).length,
  };

  const badgeColor: Record<string, string> = {
    all: "bg-rose text-white", urgent: "bg-rose text-white",
    tasks: "bg-violet/80 text-white", meetings: "bg-blue/80 text-white",
    drafts: "bg-amber text-black",
  };

  return (
    <aside className="border-r border-border bg-surface flex flex-col overflow-y-auto pb-4">
      {/* Nav section */}
      <div className="px-2.5 pt-4 pb-2">
        <p className="text-[9px] uppercase tracking-[1.5px] text-dim px-2 mb-1.5">Navigation</p>
        {NAV.map((item) => {
          const count = counts[item.key] ?? 0;
          const active = item.key === activeView;
          return (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`relative flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs cursor-pointer mb-0.5 transition-all
                ${active ? "bg-amber/10 text-amber" : "text-muted hover:bg-surface2 hover:text-ink"}`}
            >
              {active && (
                <span className="absolute left-0 top-[18%] h-[64%] w-0.5 bg-amber rounded-r-sm" />
              )}
              <span className="text-sm">{item.icon}</span>
              {item.label}
              {count > 0 && (
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${badgeColor[item.key] ?? "bg-rose text-white"}`}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-2.5 my-1 h-px bg-border" />

      {/* Agents nav */}
      <div className="px-2.5 py-2">
        <p className="text-[9px] uppercase tracking-[1.5px] text-dim px-2 mb-1.5">Agents</p>
        {AGENTS.map((a) => (
          <div key={a.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-muted hover:bg-surface2 hover:text-ink cursor-pointer mb-0.5 transition-all">
            <span className="text-sm">{a.icon}</span>
            {a.label}
          </div>
        ))}
      </div>

      <div className="mx-2.5 my-1 h-px bg-border" />

      {/* Agent status card */}
      <div className="mx-2.5 bg-surface2 border border-border rounded-xl p-3">
        <p className="text-[9px] uppercase tracking-[1.2px] text-dim mb-2.5">Agent Status</p>
        {AGENTS.map((a) => {
          const state = agents[a.key];
          const dotCls = state === "busy" ? "bg-amber animate-[blink_1s_infinite]" : state === "ready" ? "bg-emerald" : "bg-dim";
          const labelCls = state === "busy" ? "text-amber" : state === "ready" ? "text-emerald" : "text-dim";
          return (
            <div key={a.key} className="flex items-center gap-2 text-[11px] mb-1.5 last:mb-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 inline-block ${dotCls}`} />
              <span className="text-ink flex-1">{a.label}</span>
              <span className={`text-[9px] uppercase tracking-wide font-semibold ${labelCls}`}>
                {state.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-center text-[10px] text-dim mt-3.5 leading-relaxed">
        Powered by <span className="text-amber font-semibold">Airia</span><br />
        <span className="text-[9px]">+ Anthropic Claude</span>
      </div>
    </aside>
  );
}
