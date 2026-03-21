"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showSomeday?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  className,
  showSomeday = false,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {date ? format(date, "MMM d, yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
        />
        {showSomeday && date && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="w-full border-t border-[var(--border)] px-3 py-2 text-sm text-muted-foreground hover:text-[var(--text-primary)] transition-colors"
          >
            Someday
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
