"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Task, TaskStatus } from "@/lib/types";

async function logActivity(
  userId: string,
  action: string,
  taskId: string,
  taskTitle: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from("activity_log").insert({
    user_id: userId,
    actor: "user",
    action,
    task_id: taskId,
    task_title_snapshot: taskTitle,
    metadata: metadata ?? null,
  });
}

export async function addTask(
  title: string,
  dueDate: string | null
): Promise<ActionResult<Task>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  const status: TaskStatus = dueDate ? "pending" : "someday";

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      status,
      due_date: dueDate,
    })
    .select()
    .single();

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  // Fire-and-forget — don't block the user waiting for the log insert
  logActivity(user.id, "task_created", data.id, title, {
    status,
    due_date: dueDate,
  });

  revalidatePath("/");
  return { success: true, data: data as Task };
}

export async function toggleComplete(
  taskId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select()
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !task)
    return {
      success: false,
      error: "This task could not be found. It may have been deleted.",
    };

  const isCompleting = task.status !== "completed";

  let newStatus: TaskStatus;
  if (isCompleting) {
    newStatus = "completed";
  } else {
    // Restore to previous status based on due_date
    newStatus = task.due_date ? "pending" : "someday";
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at: isCompleting ? new Date().toISOString() : null,
      snooze_until: null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  logActivity(
    user.id,
    isCompleting ? "task_completed" : "task_uncompleted",
    taskId,
    task.title
  );

  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function deleteTask(
  taskId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  if (task) {
    logActivity(user.id, "task_deleted", taskId, task.title);
  }

  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function updateTask(
  taskId: string,
  title: string,
  dueDate: string | null
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  // Determine status: if task was pending/someday, adjust based on new due_date
  const { data: existing } = await supabase
    .from("tasks")
    .select("status, title")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!existing)
    return {
      success: false,
      error: "This task could not be found. It may have been deleted.",
    };

  let newStatus: TaskStatus = existing.status;
  // Only adjust status for non-completed, non-snoozed tasks
  if (newStatus === "pending" || newStatus === "someday") {
    newStatus = dueDate ? "pending" : "someday";
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      due_date: dueDate,
      status: newStatus,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  logActivity(user.id, "task_updated", taskId, title, {
    old_title: existing.title,
    due_date: dueDate,
  });

  revalidatePath("/");
  return { success: true, data: undefined };
}

export async function logCheckin(type: "morning" | "evening") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("activity_log").insert({
    user_id: user.id,
    actor: "user",
    action: "checkin_completed",
    metadata: { type },
  });
}

export async function archiveCompletedTasks(
  olderThanDays?: number
): Promise<ActionResult<number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  let query = supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .is("archived_at", null);

  if (olderThanDays !== undefined) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    query = query.lte("completed_at", cutoff.toISOString());
  }

  const { data: matchingTasks } = await query;
  const count = matchingTasks?.length ?? 0;

  if (count > 0) {
    const ids = matchingTasks!.map((t) => t.id);
    const { error } = await supabase
      .from("tasks")
      .update({ archived_at: new Date().toISOString() })
      .in("id", ids);

    if (error)
      return {
        success: false,
        error: "Something went wrong. Please try again.",
      };

    await supabase.from("activity_log").insert({
      user_id: user.id,
      actor: "user",
      action: "tasks_archived",
      task_id: null,
      task_title_snapshot: null,
      metadata: { count, olderThanDays: olderThanDays ?? null },
    });
  }

  revalidatePath("/");
  return { success: true, data: count };
}

export async function snoozeTask(
  taskId: string,
  snoozeUntil: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!task)
    return {
      success: false,
      error: "This task could not be found. It may have been deleted.",
    };

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "snoozed" as TaskStatus,
      snooze_until: snoozeUntil,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  logActivity(user.id, "task_snoozed", taskId, task.title, {
    snooze_until: snoozeUntil,
  });

  revalidatePath("/");
  return { success: true, data: undefined };
}
