import Link from "next/link";
import LogoMark from "@/components/LogoMark";

const AGENTS = [
  { icon: "🧠", name: "Classifier Agent", desc: "Reads every incoming email and scores it by priority — urgent, high, normal, low — extracting tags and intent in seconds." },
  { icon: "✍️", name: "Reply Agent", desc: "Generates contextually-aware draft replies with adjustable tone. Human-in-the-loop approval before anything is sent." },
  { icon: "📅", name: "Scheduler Agent", desc: "Detects meeting requests and surfaces them for review, keeping your calendar in sync with incoming conversations." },
  { icon: "✅", name: "Task Agent", desc: "Extracts action items from emails and syncs them to Notion automatically — no copy-pasting, ever." },
  { icon: "🔔", name: "Notifier Agent", desc: "Fires Slack alerts the moment an urgent email lands, so nothing time-sensitive slips through the cracks." },
];

const INTEGRATIONS = [
  { name: "Airia", color: "#f0a030", desc: "AI orchestration layer" },
  { name: "Gmail", color: "#34d474", desc: "Read & send email" },
  { name: "Notion", color: "#7c9aee", desc: "Task sync" },
  { name: "Slack", color: "#b060f0", desc: "Urgent alerts" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">

      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }}
      />

      {/* Soft glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-amber/5 blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center">
            <LogoMark size={22} />
          </div>
          <span className="font-display font-bold text-[15px] tracking-tight text-ink">InboxPilot</span>
          <span className="text-[9px] uppercase tracking-[1.5px] text-dim bg-surface border border-border rounded px-1.5 py-0.5 ml-1">Beta</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted">
            {INTEGRATIONS.map((i) => (
              <span key={i.name} className="px-2 py-0.5 rounded border border-border bg-surface text-dim">{i.name}</span>
            ))}
          </div>
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider border border-amber bg-amber text-black hover:brightness-110 transition-all"
          >
            Sign In →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16">
        {/* Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber/25 bg-amber/5 text-[10px] font-medium uppercase tracking-wider text-amber mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block animate-[blink_2s_infinite]" />
          Airia AI Agent Challenge · 2025
        </div>

        <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink max-w-3xl leading-[1.08]">
          Your inbox, handled<br />
          <span className="text-amber">by AI agents</span>
        </h1>

        <p className="text-muted text-base sm:text-lg mt-5 max-w-xl leading-relaxed">
          InboxPilot deploys five specialized AI agents that classify, draft, schedule, task, and notify — so zero urgent email goes unread and zero action item gets lost.
        </p>

        <div className="flex items-center gap-3 mt-8">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-amber bg-amber text-black hover:brightness-110 transition-all"
          >
            Launch Dashboard →
          </Link>
          <a
            href="#agents"
            className="px-6 py-2.5 rounded-xl font-medium text-sm border border-border text-muted hover:text-ink hover:border-border2 transition-all"
          >
            See how it works
          </a>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 mt-12 pt-8 border-t border-border/50">
          {[
            { value: "5", label: "AI Agents" },
            { value: "4", label: "Integrations" },
            { value: "<1s", label: "Classify Time" },
            { value: "8m", label: "Saved / Email" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="font-display text-2xl font-bold text-amber">{s.value}</span>
              <span className="text-[10px] uppercase tracking-[1px] text-dim mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Agents section */}
      <section id="agents" className="relative z-10 max-w-5xl mx-auto px-6 pb-16">
        <p className="text-[9px] uppercase tracking-[2px] text-dim text-center mb-2">The Agent Pipeline</p>
        <h2 className="font-display font-bold text-2xl text-center text-ink mb-8">Five agents, one seamless workflow</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="bg-surface border border-border rounded-xl p-5 hover:border-amber/30 transition-colors group">
              <div className="text-2xl mb-3">{agent.icon}</div>
              <h3 className="font-display font-semibold text-sm text-ink mb-1.5 group-hover:text-amber transition-colors">{agent.name}</h3>
              <p className="text-[12px] text-muted leading-relaxed">{agent.desc}</p>
            </div>
          ))}

          {/* CTA card */}
          <div className="bg-amber/5 border border-amber/20 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-display font-semibold text-sm text-amber mb-1.5">Ready to try it?</h3>
              <p className="text-[12px] text-muted leading-relaxed">Sign in with the demo account and see all five agents process a real inbox in real time.</p>
            </div>
            <Link href="/login" className="mt-4 inline-block text-center px-4 py-2 rounded-lg text-[11px] font-semibold border border-amber text-amber hover:bg-amber hover:text-black transition-all">
              Open Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="relative z-10 border-t border-border/50 py-12 px-6">
        <p className="text-[9px] uppercase tracking-[2px] text-dim text-center mb-6">Integrations</p>
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
          {INTEGRATIONS.map((int) => (
            <div key={int.name} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-border2 transition-colors">
              <span className="w-2 h-2 rounded-full" style={{ background: int.color }} />
              <span className="font-medium text-sm text-ink">{int.name}</span>
              <span className="text-[10px] text-dim hidden sm:block">· {int.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">✉</span>
          <span className="font-display font-bold text-sm text-ink">InboxPilot</span>
        </div>
        <p className="text-[10px] text-dim">Built for the Airia AI Agent Challenge · 2025</p>
        <Link href="/login" className="text-[11px] text-amber hover:text-amber/80 transition-colors">Sign In →</Link>
      </footer>
    </div>
  );
}
