export type TaskStatus = "pending" | "someday" | "snoozed" | "completed";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  snooze_until: string | null;
  completed_at: string | null;
  source: "manual" | "ai" | "scratch_pad";
  created_at: string;
  updated_at: string;
}

export interface AiSuggestion {
  id: string;
  user_id: string;
  suggested_title: string;
  suggested_due_date: string | null;
  source_text: string;
  user_action: "accepted" | "dismissed" | null;
  task_id: string | null;
  created_at: string;
}

export interface PushPayload {
  title: string;
  body: string;
  type: "morning" | "evening";
}
