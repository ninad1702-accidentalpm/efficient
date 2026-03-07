import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
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

  // Reactivate expired snoozed tasks
  await supabase
    .from("tasks")
    .update({ status: "pending", snooze_until: null })
    .eq("user_id", user.id)
    .eq("status", "snoozed")
    .not("snooze_until", "is", null)
    .lte("snooze_until", new Date().toISOString());

  // Also reactivate snoozed tasks without due_date back to someday
  // We need to do this in two steps since we need to check due_date
  const { data: reactivated } = await supabase
    .from("tasks")
    .select("id, due_date")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .is("due_date", null);

  if (reactivated && reactivated.length > 0) {
    const somedayIds = reactivated.map((t) => t.id);
    await supabase
      .from("tasks")
      .update({ status: "someday" })
      .eq("user_id", user.id)
      .in("id", somedayIds);
  }

  // Fetch all non-snoozed tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "snoozed")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Suspense>
        <CheckInTrigger />
      </Suspense>
      <AddTaskForm />
      <TaskList tasks={(tasks as Task[]) ?? []} />
    </div>
  );
}
