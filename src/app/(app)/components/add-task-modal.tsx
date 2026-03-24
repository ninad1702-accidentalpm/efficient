"use client";

import { useState, useEffect } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DatePicker } from "./date-picker";
import {
  RecurrenceConfig,
  defaultRecurrenceConfig,
  validateRecurrenceConfig,
  type RecurrenceConfigState,
} from "./recurrence-config";
import { createRecurringTask } from "@/lib/actions/recurring-tasks";
import { useFeatureFlag } from "@/lib/use-feature-flag";
import type { RecurringTask } from "@/lib/types";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRecurring?: boolean;
  /** When provided, used for non-recurring task creation. If omitted, the modal only supports recurring tasks. */
  addTask?: (title: string, dueDate: Date | undefined) => Promise<void>;
  /** Called after a recurring task is successfully created */
  onRecurringCreated?: (rule: RecurringTask) => void;
}

export function AddTaskModal({ open, onOpenChange, initialRecurring = false, addTask, onRecurringCreated }: AddTaskModalProps) {
  const posthog = usePostHog();
  const recurringEnabled = useFeatureFlag("recurring-tasks");

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [isRecurring, setIsRecurring] = useState(initialRecurring);
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfigState>(
    defaultRecurrenceConfig
  );
  const [submitting, setSubmitting] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      setIsRecurring(initialRecurring);
      posthog?.capture("add_task_modal_opened");
      const stored = localStorage.getItem("last-task-due-date");
      if (stored) {
        const parsed = parseISO(stored);
        if (parsed >= startOfDay(new Date())) {
          setDueDate(parsed);
          return;
        }
      }
      setDueDate(new Date());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setTitle("");
    setIsRecurring(false);
    setRecurrenceConfig(defaultRecurrenceConfig);
    setSubmitting(false);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      posthog?.capture("add_task_modal_closed");
      reset();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;

    setSubmitting(true);

    if (dueDate) {
      localStorage.setItem("last-task-due-date", format(dueDate, "yyyy-MM-dd"));
    }

    if (isRecurring) {
      const startDate = format(recurrenceConfig.startDate, "yyyy-MM-dd");

      const result = await createRecurringTask({
        title: trimmed,
        frequency: recurrenceConfig.frequency,
        interval: recurrenceConfig.interval,
        daysOfWeek:
          recurrenceConfig.frequency === "weekly" &&
          recurrenceConfig.daysOfWeek.length > 0
            ? recurrenceConfig.daysOfWeek
            : null,
        dayOfMonth:
          recurrenceConfig.frequency === "monthly"
            ? recurrenceConfig.dayOfMonth
            : null,
        startDate,
        endDate:
          recurrenceConfig.endCondition === "on_date" && recurrenceConfig.endDate
            ? format(recurrenceConfig.endDate, "yyyy-MM-dd")
            : null,
        maxOccurrences:
          recurrenceConfig.endCondition === "after_count"
            ? recurrenceConfig.maxOccurrences
            : null,
      });

      if (!result.success) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }
      toast.success("Recurring task created");
      onRecurringCreated?.(result.data);
    } else if (addTask) {
      await addTask(trimmed, dueDate);
    }

    posthog?.capture("add_task_submitted", {
      is_recurring: isRecurring,
      has_due_date: !!dueDate,
    });

    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-task-title">Title</Label>
            <Input
              id="add-task-title"
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRecurring) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>
          {!isRecurring && (
            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker date={dueDate} onSelect={setDueDate} showSomeday />
            </div>
          )}
          {recurringEnabled && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="make-recurring"
                  checked={isRecurring}
                  onChange={(e) => {
                    setIsRecurring(e.target.checked);
                    posthog?.capture("add_task_recurring_toggled", {
                      enabled: e.target.checked,
                    });
                  }}
                  className="size-4 rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <Label htmlFor="make-recurring" className="cursor-pointer">
                  Make this recurring
                </Label>
              </div>
              {isRecurring && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <RecurrenceConfig
                    config={recurrenceConfig}
                    onChange={setRecurrenceConfig}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting || (isRecurring && !!validateRecurrenceConfig(recurrenceConfig))}
            className="bg-[var(--accent)] text-[var(--accent-fg)] font-medium"
          >
            {submitting ? "Adding..." : isRecurring ? "Create recurring task" : "Add task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
