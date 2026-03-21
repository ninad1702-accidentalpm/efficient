"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Task, TaskStatus } from "@/lib/types";
import {
  addTask as addTaskAction,
  toggleComplete as toggleCompleteAction,
  deleteTask as deleteTaskAction,
  updateTask as updateTaskAction,
  snoozeTask as snoozeTaskAction,
  skipTask as skipTaskAction,
  archiveCompletedTasks as archiveAction,
} from "@/lib/actions/tasks";

type OptimisticAction =
  | { type: "add"; task: Task }
  | { type: "toggle"; taskId: string }
  | { type: "delete"; taskId: string }
  | { type: "update"; taskId: string; title: string; dueDate: string | null }
  | { type: "snooze"; taskId: string }
  | { type: "skip"; taskId: string }
  | { type: "archive" };

function taskReducer(tasks: Task[], action: OptimisticAction): Task[] {
  switch (action.type) {
    case "add":
      return [action.task, ...tasks];
    case "toggle":
      return tasks.map((t) => {
        if (t.id !== action.taskId) return t;
        const isCompleting = t.status !== "completed";
        return {
          ...t,
          status: (isCompleting
            ? "completed"
            : t.due_date
              ? "pending"
              : "someday") as TaskStatus,
          completed_at: isCompleting ? new Date().toISOString() : null,
        };
      });
    case "delete":
      return tasks.filter((t) => t.id !== action.taskId);
    case "update":
      return tasks.map((t) => {
        if (t.id !== action.taskId) return t;
        let newStatus: TaskStatus = t.status;
        if (newStatus === "pending" || newStatus === "someday") {
          newStatus = action.dueDate ? "pending" : "someday";
        }
        return { ...t, title: action.title, due_date: action.dueDate, status: newStatus };
      });
    case "snooze":
      return tasks.filter((t) => t.id !== action.taskId);
    case "skip":
      return tasks.filter((t) => t.id !== action.taskId);
    case "archive":
      return tasks.filter((t) => t.status !== "completed");
  }
}

interface TaskContextValue {
  tasks: Task[];
  addTask: (title: string, dueDate: Date | undefined) => Promise<void>;
  toggleComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, title: string, dueDate: string | null) => Promise<void>;
  snoozeTask: (taskId: string, snoozeUntil: string) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  archiveCompleted: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
}

export function TaskProvider({
  initialTasks,
  children,
}: {
  initialTasks: Task[];
  children: ReactNode;
}) {
  const [tasks, dispatchOptimistic] = useOptimistic(initialTasks, taskReducer);

  const addTask = useCallback(
    async (title: string, dueDate: Date | undefined) => {
      const dueDateStr = dueDate ? format(dueDate, "yyyy-MM-dd") : null;
      const status: TaskStatus = dueDateStr ? "pending" : "someday";
      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        user_id: "",
        title,
        status,
        due_date: dueDateStr,
        snooze_until: null,
        completed_at: null,
        archived_at: null,
        source: "manual",
        recurring_task_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      dispatchOptimistic({ type: "add", task: tempTask });

      const result = await addTaskAction(title, dueDateStr);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Task added");
      }
    },
    [dispatchOptimistic]
  );

  const toggleComplete = useCallback(
    async (taskId: string) => {
      dispatchOptimistic({ type: "toggle", taskId });

      const result = await toggleCompleteAction(taskId);
      if (!result.success) {
        toast.error(result.error);
      }
    },
    [dispatchOptimistic]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      dispatchOptimistic({ type: "delete", taskId });

      const result = await deleteTaskAction(taskId);
      if (!result.success) {
        toast.error(result.error);
      }
    },
    [dispatchOptimistic]
  );

  const updateTask = useCallback(
    async (taskId: string, title: string, dueDate: string | null) => {
      dispatchOptimistic({ type: "update", taskId, title, dueDate });

      const result = await updateTaskAction(taskId, title, dueDate);
      if (!result.success) {
        toast.error(result.error);
      }
    },
    [dispatchOptimistic]
  );

  const snoozeTask = useCallback(
    async (taskId: string, snoozeUntil: string) => {
      dispatchOptimistic({ type: "snooze", taskId });

      const result = await snoozeTaskAction(taskId, snoozeUntil);
      if (!result.success) {
        toast.error(result.error);
      }
    },
    [dispatchOptimistic]
  );

  const skipTask = useCallback(
    async (taskId: string) => {
      dispatchOptimistic({ type: "skip", taskId });

      const result = await skipTaskAction(taskId);
      if (!result.success) {
        toast.error(result.error);
      }
    },
    [dispatchOptimistic]
  );

  const archiveCompleted = useCallback(async () => {
    const completedCount = tasks.filter((t) => t.status === "completed").length;
    dispatchOptimistic({ type: "archive" });

    const result = await archiveAction();
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`${completedCount} task${completedCount === 1 ? "" : "s"} cleared`);
    }
  }, [dispatchOptimistic, tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        toggleComplete,
        deleteTask,
        updateTask,
        snoozeTask,
        skipTask,
        archiveCompleted,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
