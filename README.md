# 📧 InboxPilot

**AI-powered email orchestrator that classifies, replies, alerts your team on Slack, and creates Notion tasks — all through a single Airia multi-agent pipeline.**

Built for the [Airia AI Agents Hackathon](https://airia-hackathon.devpost.com/) — Active Agents Track.

---

## 🚀 What is InboxPilot?

InboxPilot automates your entire email triage workflow. When an email arrives, a single Airia orchestrator pipeline:

1. **Classifies** the email by priority, detects tasks, meeting requests, and reply urgency
2. **Generates** a professional, context-aware reply draft
3. **Alerts** your team on Slack for urgent emails
4. **Creates** a task in Notion with priority, sender, and deadline info

No manual sorting. No missed emails. No forgotten follow-ups.

---

## 🏗️ Architecture

```
┌─────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Gmail   │────▶│  Next.js Dashboard   │────▶│   Airia Orchestrator│
│  Inbox   │     │  (Frontend + API)    │     │      Pipeline       │
└─────────┘     └──────────────────────┘     └─────────┬───────────┘
                                                       │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                              ▼                         ▼                         ▼
                   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
                   │  Email Classifier│    │   Slack Alert    │    │  Notion Task     │
                   │  + Reply Agent   │    │   (HTTP Action)  │    │  (HTTP Action)   │
                   │  (Nested Agents) │    │                  │    │                  │
                   └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI Orchestration** | Airia Platform (Agent Studio, Nested Agents, HTTP Actions) |
| **LLM** | Claude Haiku 4.5 (via Airia Model Library) |
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Email** | Gmail API (OAuth 2.0) |
| **Notifications** | Slack API (Bot Token, chat.postMessage) |
| **Task Management** | Notion API (Database page creation) |
| **Language** | TypeScript |

---

## 📁 Project Structure

```
inboxpilot/
├── app/
│   ├── api/
│   │   ├── classify/route.ts        # Email classification endpoint
│   │   ├── reply/route.ts           # Reply generation endpoint
│   │   ├── gmail/
│   │   │   ├── auth/route.ts        # Gmail OAuth initiation
│   │   │   ├── callback/route.ts    # Gmail OAuth callback
│   │   │   ├── fetch/route.ts       # Fetch emails from Gmail
│   │   │   ├── send/route.ts        # Send emails via Gmail
│   │   │   └── status/route.ts      # Gmail connection status
│   │   ├── notion/route.ts          # Notion task creation
│   │   ├── slack/route.ts           # Slack alert sending
│   │   ├── login/route.ts           # Authentication
│   │   └── logout/route.ts          # Session cleanup
│   └── dashboard/                   # Main dashboard UI
├── lib/
│   ├── airia.ts                     # Airia API client (orchestrator + pipelines)
│   ├── gmail.ts                     # Gmail API helpers
│   ├── notion.ts                    # Notion API helpers
│   ├── slack.ts                     # Slack API helpers
│   └── auth.ts                      # Authentication utilities
├── package.json
└── .env.local                       # Environment variables (not committed)
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Airia Configuration
AIRIA_API_KEY=your_airia_api_key
AIRIA_ORCHESTRATOR_ID=your_orchestrator_pipeline_guid
AIRIA_CLASSIFY_PIPELINE_ID=your_classifier_agent_guid
AIRIA_REPLY_PIPELINE_ID=your_reply_agent_guid

# Gmail OAuth
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/callback

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C0123456789

# Notion
NOTION_API_KEY=secret_your_notion_key
NOTION_DATABASE_ID=your_notion_database_id

# Authentication
DEMO_EMAIL=your_demo_email
DEMO_PASSWORD=your_demo_password
AUTH_SECRET=your_auth_secret
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- An [Airia](https://airia.com) account (free)
- Gmail API credentials
- Slack workspace with a bot app
- Notion workspace with an integration

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/inboxpilot.git
cd inboxpilot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Airia Pipeline Setup

InboxPilot requires three agents in Airia:

### 1. Email Classifier Agent
- **Model:** Claude Haiku 4.5
- **Temperature:** 0.3
- **Structured Output:** Enabled (JSON schema with priority, tags, requires_reply, has_task, task_title, task_deadline, summary, notify_slack)
- **Purpose:** Analyzes incoming emails and returns structured classification data

### 2. Reply Generator Agent
- **Model:** Claude Haiku 4.5
- **Temperature:** 0.7
- **Structured Output:** Disabled (free-text reply)
- **Purpose:** Drafts professional email replies matched to urgency and tone

### 3. Email Orchestrator (Main Pipeline)
- **Flow:** Input → Classifier Agent → Reply Agent → Slack HTTP → Notion HTTP → Output
- **Nested Agents:** References both the Classifier and Reply Generator
- **HTTP Actions:** POST to Slack API and Notion API
- **Published to:** Airia Community

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/classify` | Classify an email (routes through Airia) |
| POST | `/api/reply` | Generate a reply draft (routes through Airia) |
| GET | `/api/gmail/auth` | Initiate Gmail OAuth flow |
| GET | `/api/gmail/callback` | Handle Gmail OAuth callback |
| GET | `/api/gmail/fetch` | Fetch recent emails from Gmail |
| POST | `/api/gmail/send` | Send an email via Gmail |
| GET | `/api/gmail/status` | Check Gmail connection status |
| POST | `/api/notion` | Create a task in Notion |
| POST | `/api/slack` | Send a Slack alert |
| POST | `/api/login` | Authenticate user |
| POST | `/api/logout` | End user session |

---

## 📊 Airia API Integration

InboxPilot connects to Airia using the v2 PipelineExecution API:

```typescript
const response = await fetch(
  `https://api.airia.ai/v2/PipelineExecution/${PIPELINE_ID}`,
  {
    method: "POST",
    headers: {
      "X-API-KEY": AIRIA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userInput: "FROM: John Smith <john@co.com>\nSUBJECT: Hello\nBODY: ...",
      asyncOutput: false,
    }),
  }
);
```

---

## 🏆 Hackathon

**Airia AI Agents Hackathon** — Active Agents Track

InboxPilot demonstrates multi-agent orchestration across 4+ systems:
- AI Classification (Airia + Claude Haiku 4.5)
- AI Reply Generation (Airia + Claude Haiku 4.5)
- Slack Notifications (HTTP Action)
- Notion Task Management (HTTP Action)

---

## 📄 License

This project was built for the Airia AI Agents Hackathon. All rights reserved.

---

## 👤 Author

**Chibuchi Joseph**

Built with ❤️ using [Airia](https://airia.com)
