"use client";

import { useState, useTransition } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  updateNotificationTimes,
  updateAutoArchiveDays,
} from "@/lib/actions/profile";
import { archiveCompletedTasks } from "@/lib/actions/tasks";

interface SettingsFormProps {
  morningTime: string;
  eveningTime: string;
  autoArchiveDays: number | null;
}

const selectClassName =
  "h-8 appearance-none rounded-md border border-input bg-background pl-2.5 pr-7 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_4px_center] bg-no-repeat";

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

const ARCHIVE_OPTIONS = [
  { label: "Disabled", value: null },
  { label: "After 7 days", value: 7 },
  { label: "After 14 days", value: 14 },
  { label: "After 30 days", value: 30 },
] as const;

export function SettingsForm({
  morningTime,
  eveningTime,
  autoArchiveDays,
}: SettingsFormProps) {
  const [morning, setMorning] = useState(morningTime);
  const [evening, setEvening] = useState(eveningTime);
  const [archiveDays, setArchiveDays] = useState<number | null>(
    autoArchiveDays
  );
  const [notifSaved, setNotifSaved] = useState(false);
  const [archiveResult, setArchiveResult] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSaveNotifications() {
    startTransition(async () => {
      await updateNotificationTimes(morning, evening);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    });
  }

  function handleArchiveDaysChange(value: string) {
    const days = value === "" ? null : Number(value);
    setArchiveDays(days);
    startTransition(async () => {
      await updateAutoArchiveDays(days);
    });
  }

  function handleManualArchive() {
    setConfirmOpen(false);
    startTransition(async () => {
      const count = await archiveCompletedTasks();
      setArchiveResult(
        count > 0
          ? `Cleared ${count} completed task${count === 1 ? "" : "s"}.`
          : "No completed tasks to clear."
      );
      setTimeout(() => setArchiveResult(null), 5000);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Clear completed tasks</CardTitle>
          <CardDescription>
            Automatically clear completed tasks after a set number of days, or
            clear them manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="auto-archive">Auto-clear completed tasks</Label>
              <select
                id="auto-archive"
                value={archiveDays === null ? "" : String(archiveDays)}
                onChange={(e) => handleArchiveDaysChange(e.target.value)}
                className={`${selectClassName} w-36`}
              >
                {ARCHIVE_OPTIONS.map((opt) => (
                  <option
                    key={opt.label}
                    value={opt.value === null ? "" : String(opt.value)}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
              >
                Clear all completed tasks
              </Button>
              {archiveResult && (
                <p className="text-sm text-muted-foreground">{archiveResult}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear completed tasks?</DialogTitle>
            <DialogDescription>
              This will permanently remove all completed tasks from your list.
              Cleared tasks cannot be viewed or restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleManualArchive}
              disabled={isPending}
            >
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
