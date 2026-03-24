import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "morning_notification_time, evening_notification_time, auto_archive_days, scratch_pad_clear_on_parse"
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Settings</h1>
      <SettingsForm
        morningTime={profile?.morning_notification_time ?? "10:00"}
        eveningTime={profile?.evening_notification_time ?? "21:00"}
        autoArchiveDays={profile?.auto_archive_days ?? null}
        scratchPadClearOnParse={profile?.scratch_pad_clear_on_parse ?? true}
      />
    </div>
  );
}
