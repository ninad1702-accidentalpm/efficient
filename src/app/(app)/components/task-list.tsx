"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { isToday, isBefore, startOfDay, parseISO, format } from "date-fns";
import {
  Plus,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { TaskItem } from "./task-item";
import { AddTaskModal } from "./add-task-modal";
import { useTaskContext } from "./task-context";
import { FilterPill } from "./filter-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TodayFilter = "all" | "overdue" | "due_today";

export function TaskList() {
  const { tasks, addTask } = useTaskContext();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [todayFilter, setTodayFilter] = useState<TodayFilter>("all");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalRecurring, setAddModalRecurring] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Auto-open add modal with recurring checked when navigated with ?add=recurring
  useEffect(() => {
    if (searchParams.get("add") === "recurring") {
      setAddModalRecurring(true);
      setAddModalOpen(true);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  function handleAddModalChange(open: boolean) {
    setAddModalOpen(open);
    if (!open) setAddModalRecurring(false);
  }

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "someday"
  );

  // Sort pending: dated tasks first (sorted by due date), then someday tasks
  pendingTasks.sort((a, b) => {
    if (a.status === "someday" && b.status !== "someday") return 1;
    if (a.status !== "someday" && b.status === "someday") return -1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    return 0;
  });

  const now = startOfDay(new Date());
  const todayStr = format(now, "yyyy-MM-dd");

  const allTodayTasks = pendingTasks.filter((t) => {
    if (!t.due_date || t.status === "someday") return false;
    const d = parseISO(t.due_date);
    return isToday(d) || isBefore(startOfDay(d), now);
  });

  // Apply search filter
  const query = searchQuery.trim().toLowerCase();

  const searchedTodayTasks = query
    ? allTodayTasks.filter((t) => t.title.toLowerCase().includes(query))
    : allTodayTasks;

  // Apply section filters on top of search
  const todayTasks =
    todayFilter === "all"
      ? searchedTodayTasks
      : todayFilter === "overdue"
        ? searchedTodayTasks.filter(
            (t) => t.due_date && t.due_date < todayStr
          )
        : searchedTodayTasks.filter(
            (t) => t.due_date && t.due_date === todayStr
          );

  const noMatchMessage = (
    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
      No tasks match this filter
    </p>
  );

  return (
    <div className="space-y-4">
      {/* Header row: filters + search/add */}
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <>
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery((e.target as HTMLInputElement).value)
              }
              placeholder="Search tasks..."
              className="h-8 flex-1"
            />
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <FilterPill
                label="All"
                active={todayFilter === "all"}
                onClick={() => setTodayFilter("all")}
              />
              <FilterPill
                label="Overdue"
                active={todayFilter === "overdue"}
                onClick={() => setTodayFilter("overdue")}
              />
              <FilterPill
                label="Due Today"
                active={todayFilter === "due_today"}
                onClick={() => setTodayFilter("due_today")}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <SearchIcon className="size-4" />
              </button>
              <Button
                onClick={() => setAddModalOpen(true)}
                className="hidden bg-[var(--accent)] text-[var(--accent-fg)] font-medium rounded-lg lg:inline-flex"
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Task list */}
      {todayTasks.length === 0 ? (
        query || todayFilter !== "all" ? (
          noMatchMessage
        ) : (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Nothing due today — nice!
          </p>
        )
      ) : (
        todayTasks.map((task) => <TaskItem key={task.id} task={task} viewContext="today" />)
      )}

      {/* Floating Action Button (mobile only) */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg transition-transform active:scale-95 lg:hidden"
      >
        <Plus className="size-6" />
      </button>

      <AddTaskModal open={addModalOpen} onOpenChange={handleAddModalChange} initialRecurring={addModalRecurring} addTask={addTask} />
    </div>
  );
}
