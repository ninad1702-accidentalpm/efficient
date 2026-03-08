"use client";

import { useState } from "react";
import { isToday, isBefore, startOfDay, parseISO } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from "lucide-react";
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
  const [todayOpen, setTodayOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);

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

  const ChevronIcon = ({ open }: { open: boolean }) =>
    open ? (
      <ChevronUpIcon className="size-3.5" />
    ) : (
      <ChevronDownIcon className="size-3.5" />
    );

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface p-3">
        <button
          onClick={() => setTodayOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <ChevronIcon open={todayOpen} />
          Today ({todayTasks.length})
        </button>
        {todayOpen && (
          <div className="mt-1">
            {todayTasks.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Nothing due today — nice!
              </p>
            ) : (
              todayTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>

      {upcomingTasks.length > 0 && (
        <div className="rounded-xl bg-surface p-3">
          <div className="flex items-center gap-1.5 px-3">
            <button
              onClick={() => setUpcomingOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <ChevronIcon open={upcomingOpen} />
              Upcoming ({upcomingTasks.length})
            </button>
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
          </div>
          {upcomingOpen && (
            <div className="mt-1">
              {upcomingTasks.map((task) => <TaskItem key={task.id} task={task} />)}
            </div>
          )}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="rounded-xl bg-surface-muted p-3">
          <button
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <ChevronIcon open={completedOpen} />
            Completed ({completedTasks.length})
          </button>
          {completedOpen && (
            <div className="mt-1">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
