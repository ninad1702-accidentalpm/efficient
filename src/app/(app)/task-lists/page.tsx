import { createClient } from "@/lib/supabase/server";
import { getRecurringTasks } from "@/lib/actions/recurring-tasks";
import { TaskProvider } from "../components/task-context";
import { TaskListsView } from "./task-lists-view";
import type { Task } from "@/lib/types";

export default async function TaskListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Run all queries in parallel — snooze reactivation, someday fix,
  // task fetch, profile config, and recurring rules all fire at once
  const [, , { data: tasks }, { data: profile }, recurringRules] = await Promise.all([
    // Reactivate expired snoozed tasks
    supabase
      .from("tasks")
      .update({ status: "pending", snooze_until: null })
      .eq("user_id", user.id)
      .eq("status", "snoozed")
      .is("archived_at", null)
      .not("snooze_until", "is", null)
      .lte("snooze_until", new Date().toISOString()),
    // Fix someday tasks that got set to pending without a due_date
    supabase
      .from("tasks")
      .update({ status: "someday" })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .is("due_date", null)
      .is("archived_at", null),
    // Fetch all non-snoozed, non-archived, non-skipped tasks
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "snoozed")
      .neq("status", "skipped")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    // Fetch profile config for auto-archive
    supabase
      .from("profiles")
      .select("auto_archive_days")
      .eq("id", user.id)
      .single(),
    // Fetch recurring task rules
    getRecurringTasks(),
  ]);

  // Auto-archive: silently archive old completed tasks (fire-and-forget)
  if (profile?.auto_archive_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - profile.auto_archive_days);
    supabase
      .from("tasks")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .is("archived_at", null)
      .lte("completed_at", cutoff.toISOString())
      .then(() => {});
  }

  // NOTE: Do NOT call generateRecurringInstances() here.
  // Only the Today page (/) triggers that to avoid duplication risk.

  return (
    <TaskProvider initialTasks={(tasks as Task[]) ?? []}>
      <TaskListsView recurringRules={recurringRules} />
    </TaskProvider>
  );
}
