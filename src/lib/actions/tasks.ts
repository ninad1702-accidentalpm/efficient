"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

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

export async function addTask(title: string, dueDate: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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

  if (error) throw new Error(error.message);

  await logActivity(user.id, "task_created", data.id, title, {
    status,
    due_date: dueDate,
  });

  revalidatePath("/");
  return data;
}

export async function toggleComplete(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select()
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !task) throw new Error("Task not found");

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

  if (error) throw new Error(error.message);

  await logActivity(
    user.id,
    isCompleting ? "task_completed" : "task_uncompleted",
    taskId,
    task.title
  );

  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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

  if (error) throw new Error(error.message);

  if (task) {
    await logActivity(user.id, "task_deleted", taskId, task.title);
  }

  revalidatePath("/");
}

export async function updateTask(
  taskId: string,
  title: string,
  dueDate: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Determine status: if task was pending/someday, adjust based on new due_date
  const { data: existing } = await supabase
    .from("tasks")
    .select("status, title")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!existing) throw new Error("Task not found");

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

  if (error) throw new Error(error.message);

  await logActivity(user.id, "task_updated", taskId, title, {
    old_title: existing.title,
    due_date: dueDate,
  });

  revalidatePath("/");
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

export async function snoozeTask(taskId: string, snoozeUntil: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!task) throw new Error("Task not found");

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "snoozed" as TaskStatus,
      snooze_until: snoozeUntil,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await logActivity(user.id, "task_snoozed", taskId, task.title, {
    snooze_until: snoozeUntil,
  });

  revalidatePath("/");
}
