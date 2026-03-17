"use client";

export interface ToastItem {
  id: string;
  message: string;
}

export default function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-surface2 border border-border2 rounded-xl px-5 py-2.5 text-xs text-ink whitespace-nowrap shadow-2xl font-mono animate-[slideUp_0.25s_ease_both]"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
