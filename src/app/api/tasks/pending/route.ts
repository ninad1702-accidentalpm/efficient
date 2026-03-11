import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get user's timezone to compute "today"
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone || "America/New_York";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    new Date()
  ); // yyyy-MM-dd

  // Only return tasks due today or overdue
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .is("archived_at", null)
    .lte("due_date", today)
    .order("created_at", { ascending: false });

  return NextResponse.json({ tasks: tasks ?? [] });
}
