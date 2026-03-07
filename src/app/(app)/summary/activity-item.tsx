"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { ActivityEntry } from "@/lib/types";
import { ACTION_LABELS } from "@/lib/types";

function getActionDescription(entry: ActivityEntry): string {
  const label = ACTION_LABELS[entry.action] ?? entry.action;

  if (entry.action === "checkin_completed") {
    const type = (entry.metadata as Record<string, string> | null)?.type;
    return `completed ${type ?? ""} check-in`.trim();
  }

  if (entry.action === "checkin_sent") {
    const type = (entry.metadata as Record<string, string> | null)?.type;
    return `sent ${type ?? ""} check-in reminder`.trim();
  }

  if (entry.task_title_snapshot) {
    return `${label} "${entry.task_title_snapshot}"`;
  }

  return label;
}

export function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const isUser = entry.actor === "user";
  const time = format(new Date(entry.created_at), "h:mm a");

  return (
    <div className="flex items-start gap-3 px-3 py-2">
      <Badge variant={isUser ? "secondary" : "default"} className="mt-0.5 shrink-0">
        {isUser ? "You" : "Efficient"}
      </Badge>
      <span className="min-w-0 flex-1 text-sm text-foreground">
        {getActionDescription(entry)}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
    </div>
  );
}
