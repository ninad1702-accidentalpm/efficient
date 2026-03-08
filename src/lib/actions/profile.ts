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
