"use server";

import { createClient } from "@/lib/supabase/server";

export async function syncTimezone(timezone: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ timezone })
    .eq("id", user.id);
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);
}

export async function updateNotificationTimes(
  morning: string,
  evening: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      morning_notification_time: morning,
      evening_notification_time: evening,
    })
    .eq("id", user.id);
}

export async function updateAutoArchiveDays(days: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ auto_archive_days: days })
    .eq("id", user.id);
}

export async function updateScratchPadClearOnParse(clearOnParse: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ scratch_pad_clear_on_parse: clearOnParse })
    .eq("id", user.id);
}
