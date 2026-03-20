"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPostHogServer } from "@/lib/posthog-server";
import type { ActionResult, Task, TaskStatus } from "@/lib/types";

export async function saveScratchPad(
  content: string
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

  // Upsert: try update first, insert if no rows exist
  const { data: existing } = await supabase
    .from("scratch_pad")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const isNew = !existing;

  if (existing) {
    const { error } = await supabase
      .from("scratch_pad")
      .update({ content })
      .eq("user_id", user.id);
    if (error)
      return {
        success: false,
        error: "Your changes couldn't be saved. Please try again.",
      };
  } else {
    const { error } = await supabase
      .from("scratch_pad")
      .insert({ user_id: user.id, content });
    if (error)
      return {
        success: false,
        error: "Your changes couldn't be saved. Please try again.",
      };
  }

  const ph = getPostHogServer();
  ph.capture({
    distinctId: user.id,
    event: "scratch_pad_save_server",
    properties: { content_length: content.length, is_new: isNew },
  });

  return { success: true, data: undefined };
}

export async function confirmSuggestion(
  suggestionId: string,
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

  // Create the task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      status,
      due_date: dueDate,
      source: "scratch_pad",
    })
    .select()
    .single();

  if (taskError)
    return { success: false, error: "Something went wrong. Please try again." };

  // Update the suggestion
  const { error: suggError } = await supabase
    .from("ai_suggestions")
    .update({ user_action: "accepted", task_id: task.id })
    .eq("id", suggestionId)
    .eq("user_id", user.id);

  if (suggError)
    return { success: false, error: "Something went wrong. Please try again." };

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: user.id,
    actor: "ai",
    action: "task_created",
    task_id: task.id,
    task_title_snapshot: title,
    metadata: {
      source: "scratch_pad",
      suggestion_id: suggestionId,
      due_date: dueDate,
    },
  });

  const ph = getPostHogServer();
  ph.capture({
    distinctId: user.id,
    event: "scratch_pad_suggestion_confirmed_server",
    properties: { has_due_date: !!dueDate },
  });

  revalidatePath("/");
  revalidatePath("/scratch-pad");
  return { success: true, data: task as Task };
}

export async function dismissSuggestion(
  suggestionId: string
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

  const { error } = await supabase
    .from("ai_suggestions")
    .update({ user_action: "dismissed" })
    .eq("id", suggestionId)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  const ph = getPostHogServer();
  ph.capture({
    distinctId: user.id,
    event: "scratch_pad_suggestion_dismissed_server",
  });

  revalidatePath("/scratch-pad");
  return { success: true, data: undefined };
}

export async function updateLastProcessed(content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("scratch_pad")
    .update({ last_processed_content: content })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
