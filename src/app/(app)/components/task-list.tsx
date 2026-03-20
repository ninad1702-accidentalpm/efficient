"use client";

import { useState, useRef, useEffect } from "react";
import { isToday, isBefore, startOfDay, parseISO, format } from "date-fns";
import {
  ArchiveIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { TaskItem } from "./task-item";
import { useTaskContext } from "./task-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TodayFilter = "all" | "overdue" | "due_today";
type UpcomingFilter = "all" | "someday";

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors border ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
          : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

export function TaskList() {
  const { tasks, archiveCompleted } = useTaskContext();

  const [todayOpen, setTodayOpen] = useState(true);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [todayFilter, setTodayFilter] = useState<TodayFilter>("all");
  const [upcomingFilter, setUpcomingFilter] = useState<UpcomingFilter>("all");

  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  function handleArchiveAll() {
    setArchiveConfirmOpen(false);
    archiveCompleted();
  }

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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
  const todayStr = format(now, "yyyy-MM-dd");

  const allTodayTasks = pendingTasks.filter((t) => {
    if (!t.due_date || t.status === "someday") return false;
    const d = parseISO(t.due_date);
    return isToday(d) || isBefore(startOfDay(d), now);
  });

  const allUpcomingTasks = pendingTasks.filter(
    (t) => !allTodayTasks.includes(t)
  );

  // Sort completed by completed_at desc (most recent first)
  completedTasks.sort((a, b) => {
    if (a.completed_at && b.completed_at)
      return b.completed_at.localeCompare(a.completed_at);
    return 0;
  });

  // Apply search filter
  const query = searchQuery.trim().toLowerCase();

  const searchedTodayTasks = query
    ? allTodayTasks.filter((t) => t.title.toLowerCase().includes(query))
    : allTodayTasks;

  const searchedUpcomingTasks = query
    ? allUpcomingTasks.filter((t) => t.title.toLowerCase().includes(query))
    : allUpcomingTasks;

  const searchedCompletedTasks = query
    ? completedTasks.filter((t) => t.title.toLowerCase().includes(query))
    : completedTasks;

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

  const upcomingTasks =
    upcomingFilter === "all"
      ? searchedUpcomingTasks
      : searchedUpcomingTasks.filter((t) => t.status === "someday");

  const filteredCompletedTasks = searchedCompletedTasks;

  const ChevronIcon = ({ open }: { open: boolean }) =>
    open ? (
      <ChevronUpIcon className="size-3.5" />
    ) : (
      <ChevronDownIcon className="size-3.5" />
    );

  const noMatchMessage = (
    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
      No tasks match this filter
    </p>
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex justify-end">
        {searchOpen ? (
          <div className="flex w-full items-center gap-2">
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery((e.target as HTMLInputElement).value)
              }
              placeholder="Search tasks..."
              className="h-8"
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
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          >
            <SearchIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Today section */}
      <div className="rounded-xl bg-surface p-3">
        <div className="flex items-center justify-between px-3">
          <button
            onClick={() => setTodayOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]"
          >
            <ChevronIcon open={todayOpen} />
            Today ({todayTasks.length})
          </button>
          <div className="flex items-center gap-1">
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
        </div>
        {todayOpen && (
          <div className="mt-1">
            {todayTasks.length === 0 ? (
              query || todayFilter !== "all" ? (
                noMatchMessage
              ) : (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Nothing due today — nice!
                </p>
              )
            ) : (
              todayTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>

      {/* Upcoming section */}
      <div className="rounded-xl bg-surface p-3">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUpcomingOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]"
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
          <div className="flex items-center gap-1">
            <FilterPill
              label="All"
              active={upcomingFilter === "all"}
              onClick={() => setUpcomingFilter("all")}
            />
            <FilterPill
              label="Someday"
              active={upcomingFilter === "someday"}
              onClick={() => setUpcomingFilter("someday")}
            />
          </div>
        </div>
        {upcomingOpen && (
          <div className="mt-1">
            {upcomingTasks.length === 0 ? (
              query || upcomingFilter !== "all" ? (
                noMatchMessage
              ) : (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No upcoming tasks — you're all caught up!
                </p>
              )
            ) : (
              upcomingTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Completed section */}
      <div className="rounded-xl bg-surface-muted p-3">
        <div className="flex items-center justify-between px-3">
          <button
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]"
          >
            <ChevronIcon open={completedOpen} />
            Completed ({filteredCompletedTasks.length})
          </button>
          {filteredCompletedTasks.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setArchiveConfirmOpen(true)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <ArchiveIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>Clear all completed tasks</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {completedOpen && (
          <div className="mt-1">
            {filteredCompletedTasks.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Your completed tasks will appear here.
              </p>
            ) : (
              filteredCompletedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear completed tasks?</DialogTitle>
            <DialogDescription>
              This will permanently remove all completed tasks from your list.
              Cleared tasks cannot be viewed or restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleArchiveAll}
            >
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
