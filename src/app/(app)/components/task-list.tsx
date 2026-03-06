"use client";

import { Separator } from "@/components/ui/separator";
import { TaskItem } from "./task-item";
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

  // Sort completed by completed_at desc (most recent first)
  completedTasks.sort((a, b) => {
    if (a.completed_at && b.completed_at)
      return b.completed_at.localeCompare(a.completed_at);
    return 0;
  });

  return (
    <div className="space-y-2">
      <div>
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pending ({pendingTasks.length})
        </h2>
        <div className="mt-1">
          {pendingTasks.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No tasks yet. Add one above!
            </p>
          ) : (
            pendingTasks.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>

      {completedTasks.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed ({completedTasks.length})
            </h2>
            <div className="mt-1">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
