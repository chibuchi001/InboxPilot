"use client";

import { Email } from "@/types";

interface Props {
  email: Email;
  index: number;
  onClassify: (id: string) => void;
  onDraftReply: (id: string) => void;
  onReview: (id: string) => void;
  onMarkDone: (id: string) => void;
}

const TAG_CLS: Record<string, string> = {
  urgent:  "text-rose  border-rose/30  bg-rose/7",
  high:    "text-amber border-amber/30 bg-amber/7",
  meeting: "text-blue  border-blue/30  bg-blue/7",
  task:    "text-violet border-violet/30 bg-violet/7",
  action:  "text-amber border-amber/30 bg-amber/7",
  fyi:     "text-dim   border-border   bg-transparent",
  done:    "text-emerald border-emerald/30 bg-emerald/7",
};

function Tag({ label }: { label: string }) {
  return (
    <span className={`text-[9px] uppercase tracking-[0.7px] px-1.5 py-0.5 rounded font-bold border ${TAG_CLS[label] ?? TAG_CLS.fyi}`}>
      {label}
    </span>
  );
}

function ActionBtn({
  onClick, children, variant = "ghost", disabled = false,
}: {
  onClick: () => void; children: React.ReactNode;
  variant?: "ghost" | "amber" | "violet" | "emerald"; disabled?: boolean;
}) {
  const cls = {
    ghost:   "border-border2  bg-surface2   text-muted  hover:text-ink hover:border-border2",
    amber:   "border-amber/40 bg-amber/5    text-amber  hover:bg-amber/10",
    violet:  "border-violet/40 bg-violet/5  text-violet hover:bg-violet/10",
    emerald: "border-emerald/40 bg-emerald/5 text-emerald hover:bg-emerald/10",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.4px] border font-mono transition-all cursor-pointer
        ${cls} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export default function EmailCard({ email, index, onClassify, onDraftReply, onReview, onMarkDone }: Props) {
  const isUrgent = email.tags.includes("urgent");
  const borderCls = email.done
    ? "border-emerald/20"
    : email.processing
    ? "border-amber/40 bg-amber/[0.02]"
    : isUrgent
    ? "border-rose/20"
    : "border-border hover:border-border2";

  const priorityColor =
    email.classification?.priority === "urgent" ? "text-rose" :
    email.classification?.priority === "high"   ? "text-amber" : "text-emerald";

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-150 animate-[slideUp_0.28s_ease_both] ${borderCls} ${email.done ? "opacity-70" : ""}`}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s`, background: "var(--color-surface)" }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 text-white font-display"
          style={{ background: email.color }}
        >
          {email.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink leading-tight">{email.sender}</p>
          <p className="text-[11px] text-muted mt-0.5 truncate">{email.subject}</p>
        </div>
        <span className="text-[10px] text-dim shrink-0 whitespace-nowrap">{email.time}</span>
      </div>

      {/* Body preview */}
      <p className="text-[11px] text-muted leading-relaxed mb-2.5 line-clamp-2">
        {email.body}
      </p>

      {/* Progress bar while processing */}
      {email.processing && (
        <div className="h-0.5 bg-border rounded-full overflow-hidden mb-2.5 relative">
          <div className="absolute top-0 left-0 h-full w-2/5 bg-gradient-to-r from-amber to-amber2 rounded-full animate-[progressPulse_1.4s_ease_infinite]" />
        </div>
      )}

      {/* Tags */}
      {email.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {email.tags.map((t) => <Tag key={t} label={t} />)}
        </div>
      )}

      {/* Classification result */}
      {email.classification && (
        <div className="bg-surface2 border border-border rounded-lg px-3 py-2.5 mb-2.5 animate-[slideUp_0.25s_ease_both]">
          <p className="text-[9px] uppercase tracking-[1px] text-amber font-semibold mb-1.5">🧠 Classifier Result</p>
          <p className="text-[11px] text-ink leading-snug mb-1.5">{email.classification.summary}</p>
          <div className="flex flex-wrap gap-3 text-[10px] text-muted">
            <span>
              Priority: <strong className={`font-semibold ${priorityColor}`}>
                {email.classification.priority.toUpperCase()}
              </strong>
            </span>
            {email.classification.has_task && email.classification.task_title && (
              <span>
                Task: <strong className="text-violet">{email.classification.task_title}</strong>
                {email.classification.task_deadline && (
                  <span className="text-amber"> · {email.classification.task_deadline}</span>
                )}
              </span>
            )}
            {email.classification.notify_slack && (
              <span className="text-emerald">✓ Slack alerted</span>
            )}
          </div>
        </div>
      )}

      {/* Draft preview */}
      {email.draft && (
        <div className="bg-surface2 border border-violet/20 rounded-lg px-3 py-2.5 mb-2.5 animate-[slideUp_0.25s_ease_both]">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[9px] uppercase tracking-[1px] text-violet font-semibold">✍️ Reply Draft</p>
            {email.processing && (
              <span className="text-[9px] text-amber italic normal-case tracking-normal">streaming…</span>
            )}
          </div>
          <p className="text-[11.5px] text-muted font-serif italic leading-relaxed line-clamp-3">
            {email.draft}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-border">
        <ActionBtn
          onClick={() => onClassify(email.id)}
          disabled={email.done || email.processing}
          variant="amber"
        >
          {email.processing && !email.draft ? (
            <><span className="inline-block animate-[spin_0.75s_linear_infinite]">⟳</span> Classifying…</>
          ) : email.classification ? "✓ Re-classify" : "🧠 Classify"}
        </ActionBtn>

        <ActionBtn onClick={() => onDraftReply(email.id)} disabled={email.processing} variant="violet">
          {email.processing && email.draft ? (
            <><span className="inline-block animate-[spin_0.75s_linear_infinite]">⟳</span> Generating…</>
          ) : email.draft ? "↺ Regen Reply" : "✍ Draft Reply"}
        </ActionBtn>

        {email.draft && !email.processing && (
          <ActionBtn onClick={() => onReview(email.id)} variant="ghost">
            Review &amp; Send
          </ActionBtn>
        )}

        <div className="ml-auto">
          {email.done ? (
            <Tag label="done" />
          ) : (
            <ActionBtn onClick={() => onMarkDone(email.id)} variant="ghost">
              Mark Done
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
}
