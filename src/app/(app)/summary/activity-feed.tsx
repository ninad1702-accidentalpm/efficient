"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import type { ActivityEntry } from "@/lib/types";
import { ActivityItem } from "./activity-item";

function formatDayHeader(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

function groupByDate(entries: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const groups = new Map<string, ActivityEntry[]>();
  for (const entry of entries) {
    const date = new Date(entry.created_at);
    const key = format(date, "yyyy-MM-dd");
    const existing = groups.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }
  return groups;
}

export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/activity?cursor=${encodeURIComponent(cursor)}`
      : "/api/activity";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    return data as { entries: ActivityEntry[]; nextCursor: string | null };
  }, []);

  useEffect(() => {
    fetchPage().then((data) => {
      if (data) {
        setEntries(data.entries);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    });
  }, [fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchPage(nextCursor).then((data) => {
            if (data) {
              setEntries((prev) => [...prev, ...data.entries]);
              setNextCursor(data.nextCursor);
            }
            setLoadingMore(false);
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPage]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No activity yet — start by adding some tasks!
      </p>
    );
  }

  const grouped = groupByDate(entries);

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateKey, dayEntries]) => {
        const date = new Date(dateKey + "T00:00:00");
        return (
          <section key={dateKey}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {formatDayHeader(date)}
            </h3>
            <div className="divide-y">
              {dayEntries.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        );
      })}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      )}

      {!nextCursor && entries.length > 0 && (
        <p className="pb-4 text-center text-sm text-muted-foreground">
          No more activity
        </p>
      )}
    </div>
  );
}
