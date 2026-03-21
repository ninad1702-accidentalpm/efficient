"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Repeat, Trash2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";
import { AddTaskModal } from "../../components/add-task-modal";

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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RecurrenceConfig,
  defaultRecurrenceConfig,
  type RecurrenceConfigState,
} from "../../components/recurrence-config";
import {
  updateRecurringTask,
  archiveRecurringTask,
} from "@/lib/actions/recurring-tasks";
import {
  formatScheduleSummary,
  getNextDueDate,
} from "@/lib/recurring";
import type { RecurringTask } from "@/lib/types";

interface RecurringManagementListProps {
  initialRules: RecurringTask[];
}

export function RecurringManagementList({
  initialRules,
}: RecurringManagementListProps) {
  const posthog = usePostHog();
  const [rules, setRules] = useState(initialRules);
  const [editingRule, setEditingRule] = useState<RecurringTask | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editConfig, setEditConfig] = useState<RecurrenceConfigState>(
    defaultRecurrenceConfig
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    posthog?.capture("recurring_management_viewed");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(rule: RecurringTask) {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditConfig({
      frequency: rule.frequency,
      interval: rule.interval,
      daysOfWeek: rule.days_of_week ?? [],
      dayOfMonth: rule.day_of_month ?? 1,
      endCondition: rule.end_date
        ? "on_date"
        : rule.max_occurrences
          ? "after_count"
          : "never",
      endDate: rule.end_date ? new Date(rule.end_date) : undefined,
      maxOccurrences: rule.max_occurrences ?? 10,
      startDate: new Date(rule.start_date),
    });
  }

  async function handleSaveEdit() {
    if (!editingRule || !editTitle.trim()) return;
    setSaving(true);

    const result = await updateRecurringTask(editingRule.id, {
      title: editTitle.trim(),
      frequency: editConfig.frequency,
      interval: editConfig.interval,
      daysOfWeek:
        editConfig.frequency === "weekly" && editConfig.daysOfWeek.length > 0
          ? editConfig.daysOfWeek
          : null,
      dayOfMonth:
        editConfig.frequency === "monthly" ? editConfig.dayOfMonth : null,
      endDate:
        editConfig.endCondition === "on_date" && editConfig.endDate
          ? format(editConfig.endDate, "yyyy-MM-dd")
          : null,
      maxOccurrences:
        editConfig.endCondition === "after_count"
          ? editConfig.maxOccurrences
          : null,
    });

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Recurring rule updated");
      posthog?.capture("recurring_rule_edited", {
        recurring_task_id: editingRule.id,
      });
      // Update local state
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                title: editTitle.trim(),
                frequency: editConfig.frequency,
                interval: editConfig.interval,
                days_of_week:
                  editConfig.frequency === "weekly" &&
                  editConfig.daysOfWeek.length > 0
                    ? editConfig.daysOfWeek
                    : null,
                day_of_month:
                  editConfig.frequency === "monthly"
                    ? editConfig.dayOfMonth
                    : null,
                end_date:
                  editConfig.endCondition === "on_date" && editConfig.endDate
                    ? format(editConfig.endDate, "yyyy-MM-dd")
                    : null,
                max_occurrences:
                  editConfig.endCondition === "after_count"
                    ? editConfig.maxOccurrences
                    : null,
              }
            : r
        )
      );
    }

    setSaving(false);
    setEditingRule(null);
  }

  async function handleDelete(id: string) {
    const result = await archiveRecurringTask(id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Recurring rule deleted");
      posthog?.capture("recurring_rule_deleted", {
        recurring_task_id: id,
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
    setDeleteConfirmId(null);
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-8 text-center">
        <Repeat className="mx-auto size-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          No recurring tasks yet.
        </p>
        <Button onClick={() => setAddModalOpen(true)}>
          Add recurring task
        </Button>
        <AddTaskModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          initialRecurring
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rules.map((rule) => {
          const nextDue = getNextDueDate(rule, new Date());
          return (
            <div
              key={rule.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {rule.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatScheduleSummary(rule)}
                  </p>
                  {nextDue && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Next: {format(nextDue, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(rule)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteConfirmId(rule.id)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingRule}
        onOpenChange={(v) => !v && setEditingRule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rule-title">Title</Label>
              <Input
                id="edit-rule-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <RecurrenceConfig config={editConfig} onChange={setEditConfig} />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveEdit}
              disabled={!editTitle.trim() || saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete recurring rule?</DialogTitle>
            <DialogDescription>
              This will stop generating new instances and skip any pending future
              tasks from this rule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
