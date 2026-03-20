import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { TaskProvider } from "./components/task-context";
import { TaskList } from "./components/task-list";
import { AddTaskForm } from "./components/add-task-form";
import { CheckInTrigger } from "./components/check-in-trigger";
import type { Task } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Run all queries in parallel — snooze reactivation, someday fix,
  // task fetch, and profile config all fire at once
  const [, , { data: tasks }, { data: profile }] = await Promise.all([
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
    // Fetch all non-snoozed, non-archived tasks
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "snoozed")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    // Fetch profile config for auto-archive
    supabase
      .from("profiles")
      .select("auto_archive_days")
      .eq("id", user.id)
      .single(),
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

  return (
    <div className="space-y-6">
      <Suspense>
        <CheckInTrigger />
      </Suspense>
      <TaskProvider initialTasks={(tasks as Task[]) ?? []}>
        <AddTaskForm />
        <TaskList />
      </TaskProvider>
    </div>
  );
}
