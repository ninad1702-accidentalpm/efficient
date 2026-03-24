"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPostHogServer } from "@/lib/posthog-server";
import {
  shouldGenerateToday,
  hasReachedMaxOccurrences,
  isPastEndDate,
} from "@/lib/recurring";
import type {
  ActionResult,
  RecurringTask,
  RecurringFrequency,
} from "@/lib/types";
import { format, startOfDay } from "date-fns";

async function logActivity(
  userId: string,
  action: string,
  taskId: string | null,
  taskTitle: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from("activity_log").insert({
    user_id: userId,
    actor: "app",
    action,
    task_id: taskId,
    task_title_snapshot: taskTitle,
    metadata: metadata ?? null,
  });
}

export async function createRecurringTask(params: {
  title: string;
  frequency: RecurringFrequency;
  interval: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  maxOccurrences: number | null;
}): Promise<ActionResult<RecurringTask>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };

  const { data, error } = await supabase
    .from("recurring_tasks")
    .insert({
      user_id: user.id,
      title: params.title,
      frequency: params.frequency,
      interval: params.interval,
      days_of_week: params.daysOfWeek,
      day_of_month: params.dayOfMonth,
      start_date: params.startDate,
      end_date: params.endDate,
      max_occurrences: params.maxOccurrences,
    })
    .select()
    .single();

  if (error) {
    console.error("recurring_tasks insert failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const rule = data as RecurringTask;

  // Generate first instance if today matches
  const today = startOfDay(new Date());
  if (shouldGenerateToday(rule, today)) {
    const todayStr = format(today, "yyyy-MM-dd");
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: rule.title,
      status: "pending",
      due_date: todayStr,
      recurring_task_id: rule.id,
    });
  }

  logActivity(user.id, "recurring_rule_created", null, rule.title, {
    frequency: rule.frequency,
    interval: rule.interval,
  });

  try {
    const posthog = getPostHogServer();
    posthog?.capture({
      distinctId: user.id,
      event: "recurring_rule_created",
      properties: {
        frequency: rule.frequency,
        interval: rule.interval,
      },
    });
  } catch {
    // PostHog not configured — skip analytics
  }

  revalidatePath("/today");
  revalidatePath("/task-lists");
  return { success: true, data: rule };
}

export async function updateRecurringTask(
  id: string,
  params: {
    title?: string;
    frequency?: RecurringFrequency;
    interval?: number;
    daysOfWeek?: number[] | null;
    dayOfMonth?: number | null;
    endDate?: string | null;
    maxOccurrences?: number | null;
  }
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

  const updateFields: Record<string, unknown> = {};
  if (params.title !== undefined) updateFields.title = params.title;
  if (params.frequency !== undefined) updateFields.frequency = params.frequency;
  if (params.interval !== undefined) updateFields.interval = params.interval;
  if (params.daysOfWeek !== undefined)
    updateFields.days_of_week = params.daysOfWeek;
  if (params.dayOfMonth !== undefined)
    updateFields.day_of_month = params.dayOfMonth;
  if (params.endDate !== undefined) updateFields.end_date = params.endDate;
  if (params.maxOccurrences !== undefined)
    updateFields.max_occurrences = params.maxOccurrences;

  const { error } = await supabase
    .from("recurring_tasks")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  // Update future pending instances' titles if title changed
  if (params.title) {
    const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
    await supabase
      .from("tasks")
      .update({ title: params.title })
      .eq("recurring_task_id", id)
      .eq("status", "pending")
      .gte("due_date", todayStr);
  }

  logActivity(user.id, "recurring_rule_updated", null, params.title ?? "");

  revalidatePath("/today");
  revalidatePath("/task-lists");
  return { success: true, data: undefined };
}

export async function archiveRecurringTask(
  id: string
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

  const { data: rule } = await supabase
    .from("recurring_tasks")
    .select("title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("recurring_tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Something went wrong. Please try again." };

  // Skip all future pending instances
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
  await supabase
    .from("tasks")
    .update({ status: "skipped" })
    .eq("recurring_task_id", id)
    .eq("status", "pending")
    .gte("due_date", todayStr);

  if (rule) {
    logActivity(user.id, "recurring_rule_archived", null, rule.title);
  }

  revalidatePath("/today");
  revalidatePath("/task-lists");
  return { success: true, data: undefined };
}

export async function getRecurringTasks(): Promise<RecurringTask[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("recurring_tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return (data as RecurringTask[]) ?? [];
}

export async function generateRecurringInstances(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const posthog = getPostHogServer();
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // Fetch all active recurring rules
  const { data: rules } = await supabase
    .from("recurring_tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null);

  if (!rules || rules.length === 0) return;

  for (const rule of rules as RecurringTask[]) {
    // Check if rule has ended
    if (isPastEndDate(rule, today)) continue;

    // Check max occurrences
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("recurring_task_id", rule.id);

    if (hasReachedMaxOccurrences(rule, count ?? 0)) continue;

    // Auto-skip stale incomplete instances (past due_date, still pending)
    const { data: staleInstances } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("recurring_task_id", rule.id)
      .eq("status", "pending")
      .lt("due_date", todayStr);

    if (staleInstances && staleInstances.length > 0) {
      const staleIds = staleInstances.map((t) => t.id);
      await supabase
        .from("tasks")
        .update({ status: "skipped" })
        .in("id", staleIds);

      for (const stale of staleInstances) {
        posthog?.capture({
          distinctId: user.id,
          event: "recurring_instance_auto_skipped",
          properties: {
            task_id: stale.id,
            recurring_task_id: rule.id,
          },
        });
      }
    }

    // Generate today's instance if schedule matches
    if (shouldGenerateToday(rule, today)) {
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: rule.title,
        status: "pending",
        due_date: todayStr,
        recurring_task_id: rule.id,
      });

      // ON CONFLICT (dedup index) → error is expected if instance already exists
      if (!error) {
        posthog?.capture({
          distinctId: user.id,
          event: "recurring_instance_generated",
          properties: {
            recurring_task_id: rule.id,
            due_date: todayStr,
          },
        });
      }
    }
  }
}
