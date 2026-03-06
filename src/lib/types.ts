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
