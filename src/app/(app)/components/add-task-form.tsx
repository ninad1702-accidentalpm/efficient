"use client";

import { useEffect, useState } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTaskContext } from "./task-context";

export function AddTaskForm() {
  const { addTask } = useTaskContext();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    const stored = localStorage.getItem("last-task-due-date");
    if (stored) {
      const parsed = parseISO(stored);
      if (parsed >= startOfDay(new Date())) {
        setDueDate(parsed);
        return;
      }
    }
    setDueDate(new Date());
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    if (dueDate) {
      localStorage.setItem("last-task-due-date", format(dueDate, "yyyy-MM-dd"));
    }
    setTitle("");
    addTask(trimmed, dueDate);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        placeholder="Add a task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 bg-[var(--bg-surface)] border-[var(--border)] rounded-[10px] text-[0.9rem] focus-visible:border-[var(--accent)]"
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`gap-2 ${dueDate ? "text-foreground" : "text-muted-foreground"}`}
            />
          }
        >
          <CalendarIcon className="size-4" />
          {dueDate ? format(dueDate, "MMM d") : "Due date"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={setDueDate}
          />
          {dueDate && (
            <button
              type="button"
              className="w-full border-t px-3 py-2 text-sm text-foreground"
              onClick={() => setDueDate(undefined)}
            >
              Someday
            </button>
          )}
        </PopoverContent>
      </Popover>
      <Button type="submit" disabled={!title.trim()} className="bg-[var(--accent)] text-[var(--accent-fg)] font-medium rounded-lg">
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}
