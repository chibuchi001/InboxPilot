"use client";

import { ActivityItem, Stats, Task } from "@/types";

interface Props {
  onRunPilot: () => void;
  isRunning: boolean;
  activity: ActivityItem[];
  tasks: Task[];
  stats: Stats;
  onToggleTask: (id: string) => void;
}

export default function RightPanel({ onRunPilot, isRunning, activity, tasks, stats, onToggleTask }: Props) {
  const timeStr =
    stats.timeSaved === 0 ? "0m" :
    stats.timeSaved < 60  ? `${stats.timeSaved}m` :
    `${Math.floor(stats.timeSaved / 60)}h ${stats.timeSaved % 60}m`;

  const miniStats = [
    { label: "Processed", value: stats.processed, cls: "text-ink" },
    { label: "Saved",     value: timeStr,          cls: "text-emerald" },
    { label: "Tasks",     value: stats.tasks,      cls: "text-violet" },
    { label: "Replies",   value: stats.replies,    cls: "text-blue" },
  ];

  return (
    <aside className="border-l border-border bg-surface flex flex-col overflow-y-auto">
      {/* CTA */}
      <button
        onClick={onRunPilot}
        disabled={isRunning}
        className={`m-3.5 py-3.5 rounded-xl font-display font-bold text-[13px] text-black bg-gradient-to-br from-amber to-amber2 transition-all
          ${isRunning ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 hover:shadow-lg hover:shadow-amber/20 cursor-pointer"}`}
      >
        {isRunning ? (
          <><span className="inline-block animate-[spin_0.75s_linear_infinite]">⟳</span> Processing…</>
        ) : "▶  RUN INBOXPILOT"}
      </button>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-2 px-3.5 pb-3.5">
        {miniStats.map((s) => (
          <div key={s.label} className="bg-surface2 border border-border rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-[1px] text-dim mb-1">{s.label}</p>
            <p className={`font-display text-xl font-bold tracking-tight ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Live activity */}
      <div className="border-t border-border px-3.5 pt-3.5 pb-3">
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[1.3px] text-dim mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block animate-[blink_2s_infinite]" />
          Live Activity
        </div>
        {activity.length === 0 ? (
          <p className="text-[11px] text-dim leading-relaxed">No activity yet. Run the pilot to get started.</p>
        ) : (
          <div className="flex flex-col gap-0">
            {activity.map((item, idx) => (
              <div
                key={item.id}
                className={`flex gap-2.5 pb-2.5 mb-2.5 animate-[slideUp_0.25s_ease_both] ${idx < activity.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="w-7 h-7 rounded-lg bg-bg border border-border flex items-center justify-center text-sm shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] text-ink leading-snug"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                  <p className="text-[9px] text-dim mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="border-t border-border px-3.5 pt-3.5 flex-1">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[1.3px] text-dim mb-3">
          ✅ Extracted Tasks
          {tasks.filter((t) => !t.done).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-violet/20 text-violet font-bold">
              {tasks.filter((t) => !t.done).length}
            </span>
          )}
        </div>
        {tasks.length === 0 ? (
          <p className="text-[11px] text-dim leading-relaxed">Tasks appear here after emails are classified.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-surface2 animate-[slideUp_0.25s_ease_both]"
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`w-3.5 h-3.5 rounded shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-bold cursor-pointer transition-all border
                    ${task.done ? "bg-emerald border-emerald text-black" : "border-border2 bg-transparent"}`}
                >
                  {task.done ? "✓" : ""}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] leading-snug ${task.done ? "text-muted line-through" : "text-ink"}`}>
                    {task.title}
                  </p>
                  <p className="text-[9px] text-dim mt-0.5">
                    {task.from}
                    {task.deadline && <span className="text-amber"> · Due: {task.deadline}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
