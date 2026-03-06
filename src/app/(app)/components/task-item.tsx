"use client";

import { useState, useTransition } from "react";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

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
import { toggleComplete, deleteTask } from "@/lib/actions/tasks";
import { EditTaskDialog } from "./edit-task-dialog";
import { SnoozePicker } from "./snooze-picker";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isCompleted = task.status === "completed";

  function handleToggle() {
    startTransition(async () => {
      await toggleComplete(task.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
    });
  }

  function getDateBadge() {
    if (task.status === "someday") {
      return <Badge variant="secondary">Someday</Badge>;
    }
    if (!task.due_date) return null;

    const dueDate = parseISO(task.due_date);
    const label = isCompleted
      ? format(dueDate, "MMM d")
      : `Due ${format(dueDate, "MMM d")}`;

    if (isCompleted) {
      return <Badge variant="secondary">{label}</Badge>;
    }

    const overdue = isBefore(startOfDay(dueDate), startOfDay(new Date()));
    const today = isToday(dueDate);

    if (overdue) {
      return <Badge variant="destructive">{label}</Badge>;
    }
    if (today) {
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Due Today
        </Badge>
      );
    }
    return <Badge variant="outline">{label}</Badge>;
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50",
          isPending && "opacity-50"
        )}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
        <span
          className={cn(
            "flex-1 truncate",
            isCompleted && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>
        {getDateBadge()}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100 data-popup-open:opacity-100"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            {!isCompleted && <SnoozePicker taskId={task.id} />}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
