"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onClose: () => void;
  onAdd: (sender: string, email: string, subject: string, body: string) => void;
}

export default function AddEmailModal({ onClose, onAdd }: Props) {
  const [sender,  setSender]  = useState("");
  const [email,   setEmail]   = useState("");
  const [subject, setSubject] = useState("");
  const [body,    setBody]    = useState("");
  const [error,   setError]   = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = () => {
    if (!sender.trim()) { setError("Sender name is required"); return; }
    if (!subject.trim()) { setError("Subject is required"); return; }
    if (!body.trim()) { setError("Body is required"); return; }
    onAdd(sender.trim(), email.trim(), subject.trim(), body.trim());
  };

  const inputCls = "w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-ink outline-none focus:border-amber transition-colors font-mono mb-3";
  const labelCls = "block text-[9px] uppercase tracking-[1px] text-dim mb-1.5";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
    >
      <div className="bg-surface border border-border2 rounded-2xl w-full max-w-lg shadow-2xl animate-[slideUp_0.22s_ease_both]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-[15px] text-ink">📧 Add Email to Queue</h2>
            <p className="text-[10px] text-muted mt-1">Paste any email — agents will classify it immediately</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-surface2 border border-border flex items-center justify-center text-muted hover:text-ink text-sm cursor-pointer transition-all shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          <label className={labelCls}>Sender Name *</label>
          <input
            ref={firstRef}
            value={sender}
            onChange={(e) => { setSender(e.target.value); setError(""); }}
            placeholder="e.g. John Smith"
            className={inputCls}
          />

          <label className={labelCls}>Sender Email (optional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@company.com"
            type="email"
            className={inputCls}
          />

          <label className={labelCls}>Subject *</label>
          <input
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setError(""); }}
            placeholder="Email subject line"
            className={inputCls}
          />

          <label className={labelCls}>Email Body *</label>
          <textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); setError(""); }}
            placeholder="Paste or type the full email content…"
            rows={5}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-ink outline-none focus:border-amber transition-colors font-mono resize-y min-h-[100px] mb-2"
          />

          {error && (
            <p className="text-[11px] text-rose mb-3">⚠ {error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border mt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-[11px] uppercase tracking-wide border border-border2 text-muted hover:text-ink hover:bg-surface2 font-mono cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-1.5 rounded-md text-[11px] uppercase tracking-wide font-semibold border border-amber bg-amber text-black hover:brightness-105 font-mono cursor-pointer transition-all"
            >
              Add to Queue →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
