export interface Email {
  id: string;
  sender: string;
  email: string;
  subject: string;
  body: string;
  time: string;
  color: string;
  initials: string;
  tags: string[];
  classification: Classification | null;
  draft: string | null;
  done: boolean;
  processing: boolean;
}

export interface Classification {
  priority: "urgent" | "high" | "normal" | "low" | "spam";
  tags: string[];
  requires_reply: boolean;
  has_meeting_request: boolean;
  has_task: boolean;
  task_title: string | null;
  task_deadline: string | null;
  summary: string;
  notify_slack: boolean;
}

export interface Task {
  id: string;
  title: string;
  deadline: string | null;
  from: string;
  emailId: string;
  done: boolean;
}

export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export interface AgentState {
  classifier: "ready" | "busy" | "idle";
  reply: "ready" | "busy" | "idle";
  scheduler: "ready" | "busy" | "idle";
  task: "ready" | "busy" | "idle";
  notifier: "ready" | "busy" | "idle";
}

export interface Stats {
  processed: number;
  timeSaved: number;
  tasks: number;
  replies: number;
}
