"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateNotificationTimes,
  updateAutoArchiveDays,
} from "@/lib/actions/profile";
import { useTheme } from "@/components/theme-provider";

interface SettingsFormProps {
  morningTime: string;
  eveningTime: string;
  autoArchiveDays: number | null;
}

const selectClassName =
  "h-8 appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-2.5 pr-7 text-sm text-[var(--text-primary)] font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat";

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = ["00", "15", "30", "45"];

function TimeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [h, m] = value.split(":");
  return (
    <div className="flex gap-2">
      <select
        id={id}
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className={`${selectClassName} w-16`}
      >
        {HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="flex items-center text-sm text-muted-foreground">:</span>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className={`${selectClassName} w-16`}
      >
        {MINUTES.map((min) => (
          <option key={min} value={min}>
            {min}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SettingsForm({
  morningTime,
  eveningTime,
  autoArchiveDays,
}: SettingsFormProps) {
  const [morning, setMorning] = useState(morningTime);
  const [evening, setEvening] = useState(eveningTime);
  const [archiveDays, setArchiveDays] = useState<number | null>(
    autoArchiveDays ?? 1
  );
  const [notifSaved, setNotifSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (autoArchiveDays === null) {
      startTransition(async () => {
        await updateAutoArchiveDays(1);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSaveNotifications() {
    startTransition(async () => {
      await updateNotificationTimes(morning, evening);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    });
  }

  function handleArchiveDaysChange(value: string) {
    const parsed = parseInt(value, 10);
    if (value === "" || isNaN(parsed)) {
      setArchiveDays(null);
      startTransition(async () => {
        await updateAutoArchiveDays(null);
      });
      return;
    }
    const clamped = Math.min(365, Math.max(1, parsed));
    setArchiveDays(clamped);
    startTransition(async () => {
      await updateAutoArchiveDays(clamped);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[14px] p-6 ring-0">
        <CardHeader>
          <CardTitle className="font-display text-[1.1rem] text-[var(--text-primary)]">Appearance</CardTitle>
          <CardDescription className="text-[0.8rem] text-[var(--text-muted)]">
            Customize how Efficient looks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <div className="flex h-8 rounded-lg border border-input bg-muted p-0.5">
              <button
                onClick={theme === "dark" ? undefined : toggleTheme}
                className={`rounded-md px-3 text-sm font-medium transition-all duration-150 ${
                  theme === "dark"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dark
              </button>
              <button
                onClick={theme === "light" ? undefined : toggleTheme}
                className={`rounded-md px-3 text-sm font-medium transition-all duration-150 ${
                  theme === "light"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Light
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[14px] p-6 ring-0">
        <CardHeader>
          <CardTitle className="font-display text-[1.1rem] text-[var(--text-primary)]">Notifications</CardTitle>
          <CardDescription className="text-[0.8rem] text-[var(--text-muted)]">
            Set when you receive morning and evening check-in reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="morning-time">Morning check-in time</Label>
              <TimeSelect
                id="morning-time"
                value={morning}
                onChange={setMorning}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="evening-time">Evening check-in time</Label>
              <TimeSelect
                id="evening-time"
                value={evening}
                onChange={setEvening}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveNotifications}
                disabled={isPending}
                className="bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg font-medium"
              >
                Save
              </Button>
              {notifSaved && (
                <span className="text-sm text-muted-foreground">
                  Saved!
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[14px] p-6 ring-0">
        <CardHeader>
          <CardTitle className="font-display text-[1.1rem] text-[var(--text-primary)]">Auto-clear completed tasks</CardTitle>
          <CardDescription className="text-[0.8rem] text-[var(--text-muted)]">
            Automatically clear completed tasks after a set number of days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Auto-clear after
            </span>
            <input
              id="auto-archive"
              type="number"
              min={1}
              max={365}
              value={archiveDays ?? ""}
              onChange={(e) => handleArchiveDaysChange(e.target.value)}
              className="h-8 w-12 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-1 text-sm text-center text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
