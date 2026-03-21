"use client";

import { useState } from "react";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { MoreHorizontal, Pencil, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTaskContext } from "./task-context";
import { EditTaskDialog } from "./edit-task-dialog";
import { SnoozePicker } from "./snooze-picker";
import { RecurringScopeDialog } from "./recurring-scope-dialog";
import { archiveRecurringTask } from "@/lib/actions/recurring-tasks";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { toggleComplete, deleteTask, skipTask } = useTaskContext();
  const [editOpen, setEditOpen] = useState(false);
  const [editScopeOpen, setEditScopeOpen] = useState(false);
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false);
  const isCompleted = task.status === "completed";
  const isRecurring = !!task.recurring_task_id;

  function handleToggle() {
    toggleComplete(task.id);
  }

  function handleEditClick() {
    if (isRecurring) {
      setEditScopeOpen(true);
    } else {
      setEditOpen(true);
    }
  }

  function handleDeleteClick() {
    if (isRecurring) {
      setDeleteScopeOpen(true);
    } else {
      deleteTask(task.id);
    }
  }

  async function handleDeleteAllFuture() {
    if (!task.recurring_task_id) return;
    const result = await archiveRecurringTask(task.recurring_task_id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Recurring task deleted");
    }
  }

  function getDateBadge() {
    if (task.status === "someday") {
      return <Badge className="border border-[var(--accent)] bg-[rgba(232,197,71,0.08)] text-[var(--accent)] text-[0.72rem] rounded-full">Someday</Badge>;
    }
    if (!task.due_date) return null;

    const dueDate = parseISO(task.due_date);
    const label = isCompleted
      ? format(dueDate, "MMM d")
      : `Due ${format(dueDate, "MMM d")}`;

    if (isCompleted) {
      return <Badge className="border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[0.72rem] rounded-full">{label}</Badge>;
    }

    const overdue = isBefore(startOfDay(dueDate), startOfDay(new Date()));
    const today = isToday(dueDate);

    if (overdue) {
      return <Badge className="border border-[#E85547] bg-[rgba(232,85,71,0.08)] text-[#E85547] text-[0.72rem] rounded-full">{label}</Badge>;
    }
    if (today) {
      return (
        <Badge className="border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[0.72rem] rounded-full">
          Due Today
        </Badge>
      );
    }
    return <Badge className="border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-[0.72rem] rounded-full">{label}</Badge>;
  }

  return (
    <>
      <div
        className="group flex items-center gap-3 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-3 mb-1.5 transition-colors hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]"
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
        />
        <span
          className={cn(
            "flex-1 line-clamp-2 text-[0.9rem] text-[var(--text-primary)]",
            isCompleted && "opacity-50 line-through"
          )}
        >
          {task.title}
        </span>
        {isRecurring && (
          <Repeat className="size-3.5 text-muted-foreground" />
        )}
        {getDateBadge()}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-50 hover:opacity-100 data-popup-open:opacity-100"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditClick}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            {!isCompleted && <SnoozePicker taskId={task.id} />}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />

      {isRecurring && (
        <>
          <RecurringScopeDialog
            open={editScopeOpen}
            onOpenChange={setEditScopeOpen}
            action="edit"
            task={task}
            onJustThisOne={() => setEditOpen(true)}
            onAllFuture={() => {
              // For "all future", just open the edit dialog for now
              // (edits this instance; full rule editing is in Settings)
              setEditOpen(true);
            }}
          />
          <RecurringScopeDialog
            open={deleteScopeOpen}
            onOpenChange={setDeleteScopeOpen}
            action="delete"
            task={task}
            onJustThisOne={() => skipTask(task.id)}
            onAllFuture={handleDeleteAllFuture}
          />
        </>
      )}
    </>
  );
}
