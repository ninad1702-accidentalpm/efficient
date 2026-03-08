"use client";

import { isToday, isBefore, startOfDay, parseISO } from "date-fns";
import { InfoIcon } from "lucide-react";
import { TaskItem } from "./task-item";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "someday"
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Sort pending: dated tasks first (sorted by due date), then someday tasks
  pendingTasks.sort((a, b) => {
    if (a.status === "someday" && b.status !== "someday") return 1;
    if (a.status !== "someday" && b.status === "someday") return -1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    return 0;
  });

  const now = startOfDay(new Date());

  const todayTasks = pendingTasks.filter((t) => {
    if (!t.due_date || t.status === "someday") return false;
    const d = parseISO(t.due_date);
    return isToday(d) || isBefore(startOfDay(d), now);
  });

  const upcomingTasks = pendingTasks.filter((t) => !todayTasks.includes(t));

  // Sort completed by completed_at desc (most recent first)
  completedTasks.sort((a, b) => {
    if (a.completed_at && b.completed_at)
      return b.completed_at.localeCompare(a.completed_at);
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface p-3">
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today ({todayTasks.length})
        </h2>
        <div className="mt-1">
          {todayTasks.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nothing due today — nice!
            </p>
          ) : (
            todayTasks.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>

      {upcomingTasks.length > 0 && (
        <div className="rounded-xl bg-surface p-3">
          <h2 className="flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming ({upcomingTasks.length})
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent>
                  Tasks will move to Today once their due date arrives
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>
          <div className="mt-1">
            {upcomingTasks.map((task) => <TaskItem key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="rounded-xl bg-surface-muted p-3">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed ({completedTasks.length})
          </h2>
          <div className="mt-1">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
