"use client";

import { useState, useRef, useEffect } from "react";
import { isToday, isBefore, startOfDay, parseISO } from "date-fns";
import {
  Plus,
  SearchIcon,
  XIcon,
  Info,
} from "lucide-react";
import { TaskItem } from "../components/task-item";
import { AddTaskModal } from "../components/add-task-modal";
import { RecurringManagementList } from "../components/recurring-management-list";
import { EmptyStateUpcoming } from "../components/empty-state-upcoming";
import { useTaskContext } from "../components/task-context";
import { FilterPill } from "@/components/ui/filter-pill";
import { useFeatureFlag } from "@/lib/use-feature-flag";
import type { RecurringTask } from "@/lib/types";
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

type Tab = "upcoming" | "recurring" | "completed";
type UpcomingFilter = "all" | "someday";

interface TaskListsViewProps {
  recurringRules: RecurringTask[];
}

export function TaskListsView({ recurringRules }: TaskListsViewProps) {
  const { tasks, addTask, deleteTask, archiveCompleted } = useTaskContext();
  const recurringEnabled = useFeatureFlag("recurring-tasks");

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [upcomingFilter, setUpcomingFilter] = useState<UpcomingFilter>("all");
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalInitialRecurring, setAddModalInitialRecurring] = useState(false);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearchOpen(false);
    setSearchQuery("");
  }

  function openAddModal(recurring = false) {
    setAddModalInitialRecurring(recurring);
    setAddModalOpen(true);
  }

  function handleArchiveAll() {
    setArchiveConfirmOpen(false);
    archiveCompleted();
  }

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

  const searchedUpcomingTasks = query
    ? allUpcomingTasks.filter((t) => t.title.toLowerCase().includes(query))
    : allUpcomingTasks;

  const searchedCompletedTasks = query
    ? completedTasks.filter((t) => t.title.toLowerCase().includes(query))
    : completedTasks;

  // Apply section filters
  const upcomingTasks =
    upcomingFilter === "all"
      ? searchedUpcomingTasks
      : searchedUpcomingTasks.filter((t) => t.status === "someday");

  const filteredCompletedTasks = searchedCompletedTasks;

  const noMatchMessage = (
    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
      No tasks match this filter
    </p>
  );

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <TooltipProvider>
        <div className="flex items-center gap-6 border-b border-[var(--border-subtle)] px-1">
          <button
            onClick={() => switchTab("upcoming")}
            className={`flex items-center gap-1.5 pb-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "upcoming"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Upcoming
            <Tooltip>
              <TooltipTrigger
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="text-[var(--text-muted)]"
              >
                <Info className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                Tasks move to &ldquo;Today&rdquo; on their due date.
              </TooltipContent>
            </Tooltip>
          </button>
          {recurringEnabled && (
            <button
              onClick={() => switchTab("recurring")}
              className={`flex items-center gap-1.5 pb-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "recurring"
                  ? "border-[var(--accent)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              Recurring
              <Tooltip>
                <TooltipTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="text-[var(--text-muted)]"
                >
                  <Info className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  Changes you make here will apply to only future instances of that task.
                </TooltipContent>
              </Tooltip>
            </button>
          )}
          <button
            onClick={() => switchTab("completed")}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "completed"
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Completed
          </button>
        </div>
      </TooltipProvider>

      {/* Header row */}
      {activeTab === "upcoming" && (
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
                  active={upcomingFilter === "all"}
                  onClick={() => setUpcomingFilter("all")}
                />
                <FilterPill
                  label="Someday"
                  active={upcomingFilter === "someday"}
                  onClick={() => setUpcomingFilter("someday")}
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
                  onClick={() => openAddModal(false)}
                  className="hidden bg-[var(--accent)] text-[var(--accent-fg)] font-medium rounded-lg lg:inline-flex"
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {recurringEnabled && activeTab === "recurring" && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery((e.target as HTMLInputElement).value)
                  }
                  placeholder="Search recurring tasks..."
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
                className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground hover:text-foreground text-sm"
              >
                <SearchIcon className="size-4" />
                Search
              </button>
            )}
          </div>
          <Button
            onClick={() => openAddModal(true)}
            className="hidden bg-[var(--accent)] text-[var(--accent-fg)] font-medium rounded-lg lg:inline-flex"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      )}
      {activeTab === "completed" && completedTasks.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {searchOpen ? (
              <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground hover:text-foreground text-sm"
              >
                <SearchIcon className="size-4" />
                Search
              </button>
            )}
          </div>
          {filteredCompletedTasks.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setArchiveConfirmOpen(true)}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Upcoming tab */}
      {activeTab === "upcoming" && (
        <>
          {upcomingTasks.length === 0 ? (
            query || upcomingFilter !== "all" ? (
              noMatchMessage
            ) : (
              <EmptyStateUpcoming />
            )
          ) : (
            upcomingTasks.map((task) => (
              <TaskItem key={task.id} task={task} viewContext="upcoming" />
            ))
          )}
        </>
      )}

      {/* Recurring tab */}
      {recurringEnabled && activeTab === "recurring" && (
        <RecurringManagementList initialRules={recurringRules} searchQuery={query} hideAddButton />
      )}

      {/* Completed tab */}
      {activeTab === "completed" && (
        <>
          {filteredCompletedTasks.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Your completed tasks will appear here.
            </p>
          ) : (
            filteredCompletedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                viewContext="completed"
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </>
      )}

      {/* Floating Action Button (mobile only, hidden on Completed tab) */}
      {(activeTab === "upcoming" || activeTab === "recurring") && (
        <button
          onClick={() => openAddModal(activeTab === "recurring")}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg transition-transform active:scale-95 lg:hidden"
        >
          <Plus className="size-6" />
        </button>
      )}

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

      <AddTaskModal open={addModalOpen} onOpenChange={setAddModalOpen} addTask={addTask} initialRecurring={addModalInitialRecurring} />
    </div>
  );
}
