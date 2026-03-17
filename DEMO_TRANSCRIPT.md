# InboxPilot — Demo Video Transcript

**Suggested runtime: ~3–4 minutes**

---

## [SCENE 1 — Landing Page]
*Show the landing page at `localhost:3000`*

> Most professionals spend over an hour a day just triaging their inbox — reading, prioritising, replying, and chasing action items buried in email threads. InboxPilot changes that.
>
> This is InboxPilot — a multi-agent AI system that processes your inbox autonomously. Five specialised agents work together to classify every email by priority, draft context-aware replies, extract tasks, detect meeting requests, and fire Slack alerts. And nothing ever leaves the app without you explicitly approving it.

*Scroll slowly through the landing page to show the agent cards and integrations row.*

> The system connects to Airia as its AI orchestration layer, and integrates directly with Gmail, Notion, and Slack. Let me show you how it works.

---

## [SCENE 2 — Login]
*Click "Sign In →" to navigate to the login page.*

> Access is protected. The dashboard sits behind a login wall backed by HMAC-SHA-256 signed session tokens — cryptographically verified on every request with a built-in expiry window.

*Sign in with credentials.*

---

## [SCENE 3 — Dashboard Overview]
*The dashboard loads. Pan slowly across the layout.*

> Here's the workspace. On the left, a navigation sidebar showing all views — All Mail, Urgent, Tasks, Meetings, Drafts, and Analytics — each one populated by the agents as they process emails.
>
> In the centre, the email list. On the right, the activity feed and extracted task list. And at the bottom, a live agent terminal that logs every decision, every API call, every action the system takes in real time.
>
> At boot, you can already see the system is live — all five agents are online and the Airia orchestrator is connected.

---

## [SCENE 4 — Classify a Single Email]
*Click the "Classify" button on the first email card — "Sarah Chen — Re: Q3 Strategy".*

> Let's start with a single email. I'll hit Classify. The request goes straight to the Classifier agent, routed through the Airia pipeline. Watch the terminal.

*Show the terminal updating with log lines.*

> In under a second, the agent has read the email, assigned it a priority — in this case **High** — detected a meeting request, extracted a task, and decided whether to trigger a Slack alert. The email card updates instantly with the priority badge and tags.

*Hover over / show the classification result — priority badge, tags, summary.*

---

## [SCENE 5 — Generate a Draft Reply]
*Click "Draft Reply" on the same email card.*

> Now I'll ask the Reply agent to draft a response. This streams directly from the Airia reply pipeline token by token — you can watch it appear in real time.

*Show the streaming draft flowing into the card or the review modal opening.*

> The draft is context-aware — it knows who sent the email, what they asked, and what the priority is. But nothing happens with it yet.

---

## [SCENE 6 — Human-in-the-Loop Review Modal]
*Click "Review & Send" to open the ReviewModal.*

> Before any reply leaves the app, it goes through a human-in-the-loop review step. This is the review modal. I can read the draft, edit any word, adjust the tone, and only when I'm satisfied — I send it.

*Edit a word or two to demonstrate editability, then show the Send button.*

> If Gmail is connected, clicking Send delivers the actual email through the Gmail API. Human control is always the final step.

*Close the modal without sending (or send if Gmail is connected).*

---

## [SCENE 7 — Run Pilot (Batch Mode)]
*Click the "Run Pilot" button in the topbar.*

> Now let me show the autonomous mode. "Run Pilot" processes every unread email in the inbox in sequence — no user interaction needed.

*Watch the emails light up one by one as the Classifier agent works through them.*

> Each email gets classified, tasks are extracted and added to the task panel on the right, urgent emails trigger notifier agent entries in the terminal. The entire inbox, triaged in seconds.

*Show the right panel filling up with tasks and activity items.*

---

## [SCENE 8 — Navigation Views]
*Click through Urgent, Tasks, Meetings in the sidebar.*

> The sidebar views filter the inbox by what the agents found. Urgent shows only the critical emails. Tasks shows everything the Task agent extracted — ready to be synced to Notion. Meetings surfaces every email the Scheduler agent flagged as containing a meeting request.

---

## [SCENE 9 — Analytics View]
*Click Analytics in the sidebar.*

> And the Analytics view gives a live breakdown — priority distribution across the processed inbox, total emails handled, time saved, tasks extracted, and replies drafted.

---

## [SCENE 10 — Gmail Integration (optional segment)]
*If Gmail is connected, click "Fetch Inbox" in the topbar.*

> If you have Gmail connected via OAuth2, hitting Fetch Inbox replaces the seed emails with your live inbox — real messages, fetched in parallel, and ready for the agent pipeline. The same classify-draft-review-send flow applies, except now sending actually delivers to real recipients.

---

## [SCENE 11 — Terminal Close-up]
*Scroll down to the Terminal component.*

> The live terminal gives you full transparency into everything the system is doing — every agent activation, every API call to Airia or Groq, every classification result, every error. No black boxes.

---

## [SCENE 12 — Closing]
*Return to the full dashboard view.*

> InboxPilot is built on Next.js 16 with the App Router, TypeScript end-to-end, Tailwind CSS, and Groq's `llama-3.3-70b-versatile` as the LLM fallback — with Airia serving as the primary orchestration layer for both agent pipelines.
>
> Five agents. One click. Your inbox, handled.

---

*[End screen — show the InboxPilot logo / landing page]*
