"use client";

import { useEffect, useRef } from "react";

export interface TermLine {
  id: string;
  html: string;
}

export default function Terminal({ lines }: { lines: TermLine[] }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="mx-6 mb-6 bg-black border border-border rounded-xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface2 border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-rose" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald" />
        <span className="ml-2 text-[10px] text-muted font-mono">inboxpilot · airia-agent-system</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block animate-[blink_2s_infinite]" />
          <span className="text-[9px] text-emerald">LIVE</span>
        </div>
      </div>

      {/* Log body */}
      <div
        ref={bodyRef}
        className="p-3 text-[11px] leading-7 text-emerald max-h-44 overflow-y-auto font-mono"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            dangerouslySetInnerHTML={{ __html: line.html }}
            className="mb-0.5"
          />
        ))}
      </div>
    </div>
  );
}
