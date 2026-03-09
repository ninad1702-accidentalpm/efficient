import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { PushPayload } from "@/lib/types";

// Use service-role client for cron (no cookie-based auth)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getLocalHour(utcDate: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(utcDate);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0"
    );
    return hour * 60 + minute; // return minutes since midnight
  } catch {
    return -1;
  }
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(
    "mailto:notifications@efficient.app",
    vapidPublicKey,
    vapidPrivateKey
  );

  const supabase = getSupabaseAdmin();
  const now = new Date();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "id, push_subscription, timezone, morning_notification_time, evening_notification_time"
    )
    .not("push_subscription", "is", null);

  if (profilesError || !profiles) {
    return NextResponse.json(
      { error: profilesError?.message ?? "No profiles" },
      { status: 500 }
    );
  }

  let sent = 0;

  for (const profile of profiles) {
    const timezone = profile.timezone || "America/New_York";
    const localMinutes = getLocalHour(now, timezone);
    if (localMinutes === -1) continue;

    const morningMinutes = parseTimeToMinutes(
      profile.morning_notification_time || "10:00"
    );
    const eveningMinutes = parseTimeToMinutes(
      profile.evening_notification_time || "21:00"
    );

    let notificationType: "morning" | "evening" | null = null;

    if (Math.abs(localMinutes - morningMinutes) <= 7) {
      notificationType = "morning";
    } else if (Math.abs(localMinutes - eveningMinutes) <= 7) {
      notificationType = "evening";
    }

    if (!notificationType) continue;

    // Dedup: skip if already sent this type in the last 12 hours
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const { count: alreadySent } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("action", "checkin_sent")
      .gte("created_at", twelveHoursAgo.toISOString())
      .contains("metadata", { type: notificationType });

    if ((alreadySent ?? 0) > 0) continue;

    // Count today's tasks (due today or overdue) — exclude archived
    const localDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
    }).format(now); // yyyy-MM-dd
    const { count } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "pending")
      .is("archived_at", null)
      .lte("due_date", localDateStr);

    const taskCount = count ?? 0;

    const payload: PushPayload =
      notificationType === "morning"
        ? {
            title: "Good morning!",
            body:
              taskCount > 0
                ? `You have ${taskCount} task${taskCount === 1 ? "" : "s"} for today. Ready to plan your day?`
                : "No tasks for today — add some if you'd like!",
            type: "morning",
          }
        : {
            title: "Evening check-in",
            body:
              taskCount > 0
                ? `You still have ${taskCount} task${taskCount === 1 ? "" : "s"} for today. How did it go?`
                : "All done for the day! Great work. Want to add tasks for tomorrow?",
            type: "evening",
          };

    // Write dedup log BEFORE sending to prevent race conditions
    const { data: logEntry } = await supabase
      .from("activity_log")
      .insert({
        user_id: profile.id,
        actor: "app",
        action: "checkin_sent",
        metadata: { type: notificationType, task_count: taskCount },
      })
      .select("id")
      .single();

    try {
      await webpush.sendNotification(
        profile.push_subscription,
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      const statusCode =
        err instanceof webpush.WebPushError ? err.statusCode : null;
      console.error(
        `Push failed for user ${profile.id}:`,
        statusCode ?? err
      );
      // Remove the dedup log since the push failed
      if (logEntry?.id) {
        await supabase
          .from("activity_log")
          .delete()
          .eq("id", logEntry.id);
      }
      // Remove invalid subscriptions (410 Gone or 404)
      if (statusCode === 410 || statusCode === 404) {
        await supabase
          .from("profiles")
          .update({ push_subscription: null })
          .eq("id", profile.id);
      }
    }
  }

  return NextResponse.json({ sent });
}
