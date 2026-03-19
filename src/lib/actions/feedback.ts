"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackType = "bug" | "feature" | "general";

export async function submitFeedback(type: FeedbackType, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Message is required");
  if (trimmed.length > 2000) throw new Error("Message too long");

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    user_email: user.email,
    type,
    message: trimmed,
  });

  if (error) throw new Error("Failed to submit feedback");
  return { success: true };
}
