import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");

  if (dateParam) {
    // Single-day mode: return all entries for the given date (yyyy-MM-dd)
    const dayStart = dateParam + "T00:00:00.000Z";
    const nextDay = new Date(dayStart);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const dayEnd = nextDay.toISOString();

    const { data: entries, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entries: entries ?? [] });
  }

  // Cursor-based pagination fallback
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = 50;

  let query = supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: entries, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nextCursor =
    entries && entries.length === limit
      ? entries[entries.length - 1].created_at
      : null;

  return NextResponse.json({ entries: entries ?? [], nextCursor });
}
