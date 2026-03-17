"use client";

import { useEffect, useRef, useState } from "react";
import { Email } from "@/types";

interface Props {
  email: Email;
  onClose: () => void;
  onSend: (id: string, text: string) => void;
  onRegenerate: (id: string) => void;
}

const TONES = ["professional", "friendly", "brief", "formal"] as const;

export default function ReviewModal({ email, onClose, onSend, onRegenerate }: Props) {
  const [draft, setDraft] = useState(email.draft ?? "");
  const [tone, setTone] = useState("professional");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(email.draft ?? "");
  }, [email.draft]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
    >
      <div className="bg-surface border border-border2 rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease_both]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-[15px] text-ink">✍️ Review Reply Draft</h2>
            <p className="text-[10px] text-muted mt-1">To: {email.sender} &lt;{email.email}&gt;</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-surface2 border border-border flex items-center justify-center text-muted hover:text-ink text-sm cursor-pointer transition-all shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">

          {/* Original email */}
          <p className="text-[9px] uppercase tracking-[1px] text-dim mb-2">Original Email</p>
          <div className="bg-surface2 border border-border rounded-xl px-4 py-3 text-xs text-muted leading-relaxed font-serif italic mb-5">
            {email.body}
          </div>

          {/* Draft editor */}
          <p className="text-[9px] uppercase tracking-[1px] text-dim mb-2">AI Draft — Edit Before Sending</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={7}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-ink font-serif italic leading-relaxed resize-y outline-none focus:border-amber transition-colors"
          />

          {/* Tone selector */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[9px] uppercase tracking-[1px] text-dim">Tone:</span>
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`text-[9px] px-2 py-0.5 rounded cursor-pointer border capitalize transition-all
                  ${tone === t
                    ? "border-amber/40 text-amber bg-amber/8"
                    : "border-border text-muted hover:text-ink"
                  }`}
              >
                {t}
              </button>
            ))}
            <span className="ml-auto text-[9px] text-dim">{draft.length} chars</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-[11px] uppercase tracking-wide border border-border2 text-muted hover:text-ink hover:bg-surface2 font-mono cursor-pointer transition-all"
            >
              Discard
            </button>
            <button
              onClick={() => onRegenerate(email.id)}
              className="px-4 py-1.5 rounded-md text-[11px] uppercase tracking-wide border border-border2 text-muted hover:text-ink hover:bg-surface2 font-mono cursor-pointer transition-all"
            >
              ↺ Regenerate
            </button>
            <button
              onClick={() => onSend(email.id, draft)}
              disabled={!draft.trim()}
              className="px-5 py-1.5 rounded-md text-[11px] uppercase tracking-wide font-semibold border border-amber bg-amber text-black hover:brightness-105 font-mono cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Reply →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
