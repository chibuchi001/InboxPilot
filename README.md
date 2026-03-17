# InboxPilot — AI Agent Email Triage Dashboard

InboxPilot is a multi-agent AI system that processes your email inbox autonomously. Five specialized agents work in a pipeline to classify every email by priority, draft context-aware replies, extract tasks, detect meeting requests, and fire Slack alerts — all with a human-in-the-loop review step before anything is sent.

---

## The Five Agents

| Agent | Responsibility |
|---|---|
| **Classifier** | Scores every email by priority (urgent / high / normal / low / spam), extracts tags, detects tasks and meeting requests |
| **Reply** | Streams a context-aware draft reply with adjustable tone — held for human approval before sending |
| **Scheduler** | Surfaces meeting requests from emails for calendar review |
| **Task** | Extracts action items and syncs them to Notion |
| **Notifier** | Fires a Slack alert the moment an urgent email is detected |

All agents are orchestrated through **Airia** when configured, with automatic fallback to **Groq** (`llama-3.3-70b-versatile`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Orchestration | Airia (primary) · Groq `llama-3.3-70b-versatile` (fallback) |
| Email API | Gmail API via OAuth2 — raw `fetch`, no extra SDK |
| Task Sync | Notion API — creates database entries with deadline resolution |
| Alerts | Slack Incoming Webhooks — Block Kit formatted messages |
| Auth | HMAC-SHA-256 signed session cookies — no external auth library |
| Persistence | Browser `localStorage` |

---

## Features

- **Multi-agent pipeline** — five agents with distinct roles running in sequence per email
- **Airia integration** — primary AI orchestration layer; Groq used as automatic fallback
- **Gmail integration** — OAuth2 connect, fetch real inbox emails, send AI-drafted replies
- **Human-in-the-loop** — every AI reply requires review and approval before it leaves the app
- **Streaming replies** — reply drafts stream token-by-token into the review modal in real time
- **localStorage persistence** — inbox, tasks, stats, and activity survive page refreshes
- **Auth-protected dashboard** — landing page + login wall with signed, expiring session cookies
- **Live agent terminal** — every agent action, API call, and decision logged in real time
- **Navigation views** — All mail, Urgent, Tasks, Meetings, Drafts, Analytics

---

## Project Structure

```
inboxpilot/
├── app/
│   ├── page.tsx                          # Landing page (public)
│   ├── login/page.tsx                    # Login page (public)
│   ├── dashboard/page.tsx                # Main dashboard (auth-protected)
│   └── api/
│       ├── classify/route.ts             # Classifier agent endpoint
│       ├── reply/route.ts                # Reply agent endpoint (streaming)
│       ├── auth/
│       │   ├── login/route.ts            # POST — validate credentials + set cookie
│       │   ├── logout/route.ts           # POST — clear session cookie
│       │   └── gmail/
│       │       ├── route.ts              # GET — return OAuth consent URL
│       │       ├── callback/route.ts     # GET — exchange code, save tokens
│       │       └── status/route.ts       # GET — check connection status
│       └── gmail/
│           ├── fetch/route.ts            # GET — fetch inbox emails
│           └── send/route.ts             # POST — send email via Gmail API
├── components/
│   ├── Topbar.tsx                        # Header: agent status, Gmail controls, logout
│   ├── Sidebar.tsx                       # Navigation + agent health indicators
│   ├── EmailCard.tsx                     # Per-email classify / reply / review actions
│   ├── ReviewModal.tsx                   # HITL reply review + tone selector
│   ├── RightPanel.tsx                    # Activity feed + task list
│   ├── Terminal.tsx                      # Live agent log
│   └── ToastStack.tsx                    # Notification toasts
├── lib/
│   ├── airia.ts                          # Airia pipeline client (classify + reply)
│   ├── groq.ts                           # Groq SDK client
│   ├── gmail.ts                          # Gmail OAuth2 + API (raw fetch, no SDK)
│   ├── auth.ts                           # HMAC-SHA-256 session tokens + rate limiter
│   ├── storage.ts                        # localStorage helpers (SSR-safe)
│   └── data.ts                           # Seed emails for demo mode
├── middleware.ts                          # Protects /dashboard — verifies signed token
└── types/index.ts                         # Email, Classification, Task, AgentState, Stats
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — all three auth vars and `GROQ_API_KEY` are required:

```env
# Authentication — all three are required, no insecure defaults exist
DEMO_EMAIL=you@example.com
DEMO_PASSWORD=your-strong-password

# Generate with: openssl rand -hex 32
AUTH_SECRET=replace-with-a-64-char-random-hex-string

# LLM — free tier at https://console.groq.com
GROQ_API_KEY=gsk_...

# Airia — optional, falls back to Groq if not set
AIRIA_API_KEY=
AIRIA_API_URL=
AIRIA_CLASSIFY_PIPELINE_ID=
AIRIA_REPLY_PIPELINE_ID=

# Gmail — optional, enables real inbox read/send
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Notion — optional, enables real task sync to Notion database
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=

# Slack — optional, enables real urgent-email alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the credentials you set above.

---

## Authentication

Sessions use **HMAC-SHA-256 signed tokens** (Web Crypto API — Edge Runtime compatible). Each token embeds an `issuedAt` timestamp and is validated for both signature and age (7-day expiry) on every protected request. The `/api/auth/login` endpoint is rate-limited to 10 attempts per IP per 15 minutes.

> **No default credentials exist.** The app refuses to start a session and returns `500` if `DEMO_EMAIL`, `DEMO_PASSWORD`, or `AUTH_SECRET` are not set.

---

## Notion Integration

1. Create a Notion integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a database for tasks with these properties: `Name` (title), `Status` (select), `Source` (rich_text), `Priority` (select), `Due Date` (date)
3. Share the database with your integration
4. Set `NOTION_TOKEN` and `NOTION_DATABASE_ID` in `.env.local`

When configured, the Task Agent calls `/api/notion/task` to create a real Notion database entry for every extracted task. Human-readable deadlines (Today, Tomorrow, Monday, Next week, etc.) are resolved to ISO dates automatically. When not configured, tasks are saved in the UI only.

---

## Slack Integration

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Incoming Webhooks** and add a webhook to your desired channel
3. Set `SLACK_WEBHOOK_URL` in `.env.local`

When configured, the Notifier Agent calls `/api/slack/notify` to deliver a structured Block Kit alert whenever an email is classified as urgent or high-priority. When not configured, the alert is logged to the terminal only.

---

## Airia Integration

When `AIRIA_API_KEY` and `AIRIA_API_URL` are set, both the Classifier and Reply agents route through your Airia pipelines. If Airia is not configured the system falls back to Groq silently — no code changes needed.

**Classify pipeline** receives `{ sender, email, subject, body }` and should return a JSON object matching:

```ts
{
  priority: "urgent" | "high" | "normal" | "low" | "spam";
  tags: string[];
  summary: string;
  has_task: boolean;
  task_title?: string;
  task_deadline?: string;
  has_meeting_request: boolean;
  notify_slack: boolean;
}
```

**Reply pipeline** receives `{ sender, subject, body, priority }` and should stream plain text.

---

## Gmail Integration

1. Create OAuth 2.0 credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable the **Gmail API** for your project
3. Add `http://localhost:3000/api/auth/gmail/callback` as an authorized redirect URI
4. Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REDIRECT_URI` in `.env.local`
5. Click **Connect Gmail** in the dashboard topbar and complete the OAuth flow
6. Use **Fetch Inbox** to pull real emails, and **Send Reply** to deliver AI-drafted messages

Token refresh is handled automatically — the stored access token is refreshed before expiry on every API call.

---

## Agent Pipeline Flow

```
New email arrives
       │
       ▼
┌──────────────┐   priority + tags + flags
│  Classifier  │ ──────────────────────────┬──────────────────────┐
└──────────────┘                           │                      │
       │                             has_task = true       notify_slack = true
       │                                   │                      │
       │                                   ▼                      ▼
       │                          ┌──────────────┐      ┌──────────────────┐
       │                          │  Task Agent  │      │ Notifier Agent   │
       │                          │  → Notion    │      │ → Slack alert    │
       │                          └──────────────┘      └──────────────────┘
       │
       ▼
┌──────────────┐   streaming draft
│ Reply Agent  │ ──────────────────▶ Review Modal (HITL)
└──────────────┘                              │
                                              │ human edits + approves
                                              ▼
                                       Gmail API send
```

---

## Deployment

This is a standard Next.js app and deploys to any Node.js host (Vercel, Railway, Fly.io, etc.).

**Required environment variables on the host** (set in your platform's dashboard — never commit `.env.local`):

| Variable | Required | Notes |
|---|---|---|
| `DEMO_EMAIL` | Yes | Login email |
| `DEMO_PASSWORD` | Yes | Login password |
| `AUTH_SECRET` | Yes | `openssl rand -hex 32` |
| `GROQ_API_KEY` | Yes | From console.groq.com |
| `GMAIL_CLIENT_ID` | Optional | Gmail OAuth |
| `GMAIL_CLIENT_SECRET` | Optional | Gmail OAuth |
| `GMAIL_REDIRECT_URI` | Optional | Must match Google Console redirect |
| `AIRIA_API_KEY` | Optional | Airia orchestration |
| `AIRIA_API_URL` | Optional | Airia orchestration |
| `AIRIA_CLASSIFY_PIPELINE_ID` | Optional | Airia classify pipeline |
| `AIRIA_REPLY_PIPELINE_ID` | Optional | Airia reply pipeline |
| `NOTION_TOKEN` | Optional | Notion integration secret |
| `NOTION_DATABASE_ID` | Optional | Notion tasks database ID |
| `SLACK_WEBHOOK_URL` | Optional | Slack incoming webhook URL |

> **Note on Gmail tokens:** `lib/gmail.ts` stores OAuth tokens on the local filesystem (`.gmail-tokens.json`). This works for single-server deployments. On serverless or multi-instance platforms (e.g. Vercel), you will need to move token storage to a persistent store (database, Redis, or KV).

---

## License

MIT

---

## Submission Questions

### Problem Statement
Knowledge workers receive dozens to hundreds of emails daily. The cost is real: urgent messages get buried, action items are missed, replies are delayed, and hours are lost every week to manual triage. Existing email clients offer filters and labels, but they require constant maintenance and still leave all the reading, deciding, and writing to the human. There is no system that autonomously understands what an email demands and acts on it end-to-end.

### Solution Overview
InboxPilot deploys five AI agents that work as a pipeline on every incoming email. The Classifier agent reads each email and assigns a priority level, extracts intent tags, detects embedded tasks, and flags meeting requests — all in under a second. If a task is found, the Task agent extracts it and syncs it to Notion. If the email is urgent, the Notifier agent fires a Slack alert immediately. The Reply agent streams a context-aware draft reply which is held for human review before anything is sent. The Scheduler agent surfaces meeting requests for calendar action. The whole pipeline can run autonomously across an entire inbox with one click ("Run Pilot"), or be triggered per email. Airia serves as the AI orchestration layer that routes each agent's request through the appropriate pipeline, with Groq as a fallback for development.

### Key Features
- **Autonomous inbox processing** — "Run Pilot" classifies every unread email in sequence without user intervention
- **Five specialized agents** — Classifier, Reply, Scheduler, Task, and Notifier each handle a distinct responsibility
- **Airia-orchestrated pipelines** — both the classification and reply agents route through Airia, with automatic Groq fallback
- **Real Gmail integration** — OAuth2 connect, live inbox fetch, and actual email sending via Gmail API
- **Streaming AI replies** — reply drafts stream token-by-token into the review modal in real time
- **Human-in-the-loop control** — no email is ever sent without explicit human review and approval
- **Cross-session persistence** — inbox state, extracted tasks, stats, and activity are saved to localStorage
- **Live agent terminal** — every agent decision, API call, and error is streamed to a live log in the UI
- **Auth-protected dashboard** — public landing page with a login wall guarding the agent workspace

### Technologies Used
| Technology | Role |
|---|---|
| **Airia** | Primary AI orchestration layer for the Classifier and Reply agent pipelines |
| **Groq** (`llama-3.3-70b-versatile`) | Fallback LLM when Airia pipelines are not configured |
| **Gmail API** (OAuth2) | Real email read and send integration — zero third-party SDK, raw `fetch` |
| **Next.js 16** (App Router) | Full-stack framework — UI, API routes, streaming, middleware |
| **TypeScript 5** | End-to-end type safety across agents, components, and API contracts |
| **Tailwind CSS 4** | UI styling |
| **localStorage** | Client-side persistence for inbox state, tasks, stats, and activity feed |

### Target Users
- **Founders and executives** who receive high volumes of email and need to triage fast without hiring an EA
- **Sales and account managers** who must respond quickly to client emails and never miss a follow-up task
- **Operations and project leads** who need action items extracted from email threads automatically
- **Any professional** spending more than 30 minutes per day on email triage who wants AI to handle the routine work while keeping humans in control of what actually gets sent

---

## Demo

```
URL:      http://localhost:3000
Email:    demo@inboxpilot.ai
Password: inboxpilot2025
```

The login page includes a "Fill demo credentials" button for quick access.

---

## The Five Agents

| Agent | Responsibility |
|---|---|
| **Classifier** | Scores every email by priority (urgent / high / normal / low / spam), extracts tags, detects tasks and meeting requests |
| **Reply** | Streams a context-aware draft reply with adjustable tone — held for human approval before sending |
| **Scheduler** | Surfaces meeting requests from emails for calendar review |
| **Task** | Extracts action items and syncs them to Notion |
| **Notifier** | Fires a Slack alert the moment an urgent email is detected |

All agents are orchestrated through **Airia** when configured, with automatic fallback to **Groq** (`llama-3.3-70b-versatile`) for development or when Airia keys are absent.

---

## Features

- **Multi-agent pipeline** — five agents with distinct roles running in sequence per email
- **Airia integration** — primary AI orchestration layer; Groq used as automatic fallback
- **Gmail integration** — OAuth2 connect, fetch real inbox emails, send AI-drafted replies
- **Real email sending** — when Gmail is connected, "Send Reply" delivers the draft for real
- **Human-in-the-loop** — every AI reply requires review and approval before it leaves the app
- **Streaming replies** — reply drafts stream token-by-token into the review modal in real time
- **localStorage persistence** — inbox, tasks, stats, and activity survive page refreshes
- **Auth-protected dashboard** — landing page + login wall with session cookies
- **Live agent terminal** — every agent action, API call, and decision logged in real time
- **Navigation views** — All mail, Urgent, Tasks, Meetings, Drafts, Analytics
- **Analytics view** — priority breakdown chart and per-status email counts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Orchestration | Airia (primary) · Groq `llama-3.3-70b-versatile` (fallback) |
| Email API | Gmail API via OAuth2 — zero extra dependencies, raw `fetch` |
| Auth | Cookie-based sessions — no external auth library |
| Persistence | Browser `localStorage` |

---

## Project Structure

```
inboxpilot/
├── app/
│   ├── page.tsx                          # Landing page (public)
│   ├── login/page.tsx                    # Login page (public)
│   ├── dashboard/page.tsx                # Main dashboard (auth-protected)
│   └── api/
│       ├── classify/route.ts             # Classifier agent endpoint
│       ├── reply/route.ts                # Reply agent endpoint (streaming)
│       ├── auth/
│       │   ├── login/route.ts            # POST — validate credentials + set cookie
│       │   ├── logout/route.ts           # POST — clear session cookie
│       │   └── gmail/
│       │       ├── route.ts              # GET — return OAuth consent URL
│       │       ├── callback/route.ts     # GET — exchange code, save tokens
│       │       └── status/route.ts       # GET — check connection status
│       └── gmail/
│           ├── fetch/route.ts            # GET — fetch inbox emails
│           └── send/route.ts             # POST — send email via Gmail API
├── components/
│   ├── Topbar.tsx                        # Header: agent status, Gmail controls, logout
│   ├── Sidebar.tsx                       # Navigation + agent health indicators
│   ├── EmailCard.tsx                     # Per-email classify / reply / review actions
│   ├── ReviewModal.tsx                   # HITL reply review + tone selector
│   ├── RightPanel.tsx                    # Activity feed + task list
│   ├── Terminal.tsx                      # Live agent log
│   └── ToastStack.tsx                    # Notification toasts
├── lib/
│   ├── airia.ts                          # Airia pipeline client (classify + reply)
│   ├── groq.ts                           # Groq client with env fallback
│   ├── gmail.ts                          # Gmail OAuth2 + API (raw fetch, no SDK)
│   ├── auth.ts                           # Session token helpers (Edge-compatible)
│   ├── storage.ts                        # localStorage helpers (SSR-safe)
│   └── data.ts                           # Seed emails + avatar constants
├── middleware.ts                          # Protects /dashboard — redirects to /login
└── types/index.ts                         # Email, Classification, Task, AgentState, Stats
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — free tier at https://console.groq.com
GROQ_API_KEY=gsk_...

# Auth
AUTH_SECRET=change-this-in-production
DEMO_EMAIL=demo@inboxpilot.ai
DEMO_PASSWORD=inboxpilot2025

# Airia — optional, falls back to Groq if not set
AIRIA_API_KEY=
AIRIA_API_URL=
AIRIA_CLASSIFY_PIPELINE_ID=
AIRIA_REPLY_PIPELINE_ID=

# Gmail — optional, enables real inbox read/send
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials.

---

## Airia Integration

When `AIRIA_API_KEY` and `AIRIA_API_URL` are set, both the Classifier and Reply agents route through your Airia pipelines. If Airia is not configured the system falls back to Groq silently — no code changes needed.

**Classify pipeline** receives `{ sender, email, subject, body }` and should return a JSON object matching:

```ts
{
  priority: "urgent" | "high" | "normal" | "low" | "spam";
  tags: string[];
  summary: string;
  has_task: boolean;
  task_title?: string;
  task_deadline?: string;
  has_meeting_request: boolean;
  notify_slack: boolean;
}
```

**Reply pipeline** receives `{ sender, subject, body, priority }` and should stream plain text.

---

## Gmail Integration

1. Create OAuth 2.0 credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable the **Gmail API** for your project
3. Add `http://localhost:3000/api/auth/gmail/callback` as an authorized redirect URI
4. Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REDIRECT_URI` in `.env`
5. Click **Connect Gmail** in the dashboard topbar and complete the OAuth flow
6. Use **Fetch Inbox** to pull real emails, and **Send Reply** to deliver AI-drafted messages

Token refresh is handled automatically — the stored access token is refreshed before expiry on every API call.

---

## Agent Pipeline Flow

```
New email arrives
       │
       ▼
┌──────────────┐   priority + tags + flags
│  Classifier  │ ──────────────────────────┬──────────────────────┐
└──────────────┘                           │                      │
       │                             has_task = true       notify_slack = true
       │                                   │                      │
       │                                   ▼                      ▼
       │                          ┌──────────────┐      ┌──────────────────┐
       │                          │  Task Agent  │      │ Notifier Agent   │
       │                          │  → Notion    │      │ → Slack alert    │
       │                          └──────────────┘      └──────────────────┘
       │
       ▼
┌──────────────┐   streaming draft
│ Reply Agent  │ ──────────────────▶ Review Modal (HITL)
└──────────────┘                              │
                                              │ human edits + approves
                                              ▼
                                       Gmail API send
```

---

## Hackathon Requirements

| Requirement | Implementation |
|---|---|
| Airia platform integration | `lib/airia.ts` — Airia-first routing in both classify and reply agents |
| Multiple integrated systems | Airia + Gmail (read/send) + Groq (AI fallback) |
| Real email integration | Gmail OAuth2 — fetch inbox + send replies via Gmail API |
| Autonomous agent behavior | "Run Pilot" classifies the entire inbox without user intervention |
| Human-in-the-loop | Reply approval modal — no email is sent without explicit user confirmation |
| Data persistence | `lib/storage.ts` — emails, tasks, stats, activity saved to localStorage |
| Multi-agent architecture | 5 agents: Classifier, Reply, Scheduler, Task, Notifier |
| Authentication | Landing page + login wall + session cookies protecting `/dashboard` |

---

## License

MIT
