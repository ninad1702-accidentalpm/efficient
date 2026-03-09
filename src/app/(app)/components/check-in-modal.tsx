"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { toggleComplete, addTask, logCheckin } from "@/lib/actions/tasks";
import { DatePicker } from "./date-picker";
import type { Task } from "@/lib/types";
import { PlusIcon } from "lucide-react";

interface CheckInModalProps {
  type: "morning" | "evening";
  tasks: Task[];
  onClose: () => void;
}

export function CheckInModal({ type, tasks, onClose }: CheckInModalProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [isPending, startTransition] = useTransition();

  const pendingCount = localTasks.filter((t) => t.status !== "completed").length;

  const title =
    type === "morning" ? "Morning check-in" : "Evening check-in";

  const description =
    type === "morning"
      ? pendingCount > 0
        ? `You have ${pendingCount} task${pendingCount === 1 ? "" : "s"} on your plate. Tick off anything you've already done, or add new tasks to plan your day.`
        : "Your slate is clean! Add some tasks below to plan your day."
      : pendingCount > 0
        ? `You have ${pendingCount} task${pendingCount === 1 ? "" : "s"} remaining. Tick off anything you finished today.`
        : "All done — nice work today!";

  function handleToggle(taskId: string) {
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === "completed" ? "pending" : "completed",
            }
          : t
      )
    );
    startTransition(async () => {
      await toggleComplete(taskId);
    });
  }

  function handleAddTask() {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const dueDate = newTaskDueDate ? format(newTaskDueDate, "yyyy-MM-dd") : null;
    setNewTaskTitle("");
    setNewTaskDueDate(undefined);
    startTransition(async () => {
      const task = await addTask(trimmed, dueDate);
      if (task) {
        setLocalTasks((prev) => [task, ...prev]);
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      await logCheckin(type);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {localTasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {type === "morning"
                ? "No tasks yet — use the input below to add some."
                : "No tasks — enjoy your evening!"}
            </p>
          ) : (
            localTasks.map((task) => (
              <label
                key={task.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => handleToggle(task.id)}
                />
                <span
                  className={
                    task.status === "completed"
                      ? "text-muted-foreground line-through"
                      : ""
                  }
                >
                  {task.title}
                </span>
              </label>
            ))
          )}
        </div>

        {type === "morning" && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
              className="flex-1"
            />
            <DatePicker
              date={newTaskDueDate}
              onSelect={setNewTaskDueDate}
              placeholder="Due date"
              className="h-9 text-xs"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAddTask}
              disabled={isPending || !newTaskTitle.trim()}
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleClose} disabled={isPending}>
            {isPending ? "Saving..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
