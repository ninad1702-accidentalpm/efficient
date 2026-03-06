"use client";

import { useState, useTransition } from "react";
import { addDays, nextMonday, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";
import { snoozeTask } from "@/lib/actions/tasks";

interface SnoozePickerProps {
  taskId: string;
}

export function SnoozePicker({ taskId }: SnoozePickerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSnooze(date: Date) {
    startTransition(async () => {
      await snoozeTask(taskId, date.toISOString());
      setOpen(false);
    });
  }

  const tomorrow = addDays(new Date(), 1);
  tomorrow.setHours(8, 0, 0, 0);

  const nextWeek = nextMonday(new Date());
  nextWeek.setHours(8, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button className="flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground" />
        }
      >
        <Clock className="size-4" />
        Snooze
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side="right">
        <div className="flex flex-col gap-1 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            disabled={isPending}
            onClick={() => handleSnooze(tomorrow)}
          >
            Tomorrow ({format(tomorrow, "EEE, MMM d")})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            disabled={isPending}
            onClick={() => handleSnooze(nextWeek)}
          >
            Next Week ({format(nextWeek, "EEE, MMM d")})
          </Button>
        </div>
        <Separator />
        <Calendar
          mode="single"
          disabled={{ before: new Date() }}
          onSelect={(date) => {
            if (date) {
              const snoozeDate = new Date(date);
              snoozeDate.setHours(8, 0, 0, 0);
              handleSnooze(snoozeDate);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
