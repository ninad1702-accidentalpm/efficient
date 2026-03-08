"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, format, isToday, isYesterday, startOfDay } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ActivityEntry } from "@/lib/types";
import { ActivityItem } from "./activity-item";
import { Button } from "@/components/ui/button";

function formatDayHeader(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export function ActivityFeed() {
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDay = useCallback(async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const res = await fetch(`/api/activity?date=${dateStr}`);
    if (!res.ok) throw new Error("Failed to load activity");
    const data = await res.json();
    return data.entries as ActivityEntry[];
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchDay(currentDate)
      .then((data) => setEntries(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [currentDate, fetchDay]);

  const goToPreviousDay = () => setCurrentDate((d) => addDays(d, -1));
  const goToNextDay = () => setCurrentDate((d) => addDays(d, 1));

  const viewingToday = isToday(currentDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="min-w-[140px] text-center text-lg font-semibold">
          {formatDayHeader(currentDate)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={viewingToday}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load activity
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setError(false);
              fetchDay(currentDate)
                .then((data) => setEntries(data))
                .catch(() => setError(true))
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          No activity on this day
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="divide-y">
          {entries.map((entry) => (
            <ActivityItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
