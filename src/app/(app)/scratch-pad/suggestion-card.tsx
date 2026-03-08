"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Check, X, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "../components/date-picker";
import { confirmSuggestion, dismissSuggestion } from "@/lib/actions/scratch-pad";
import type { AiSuggestion } from "@/lib/types";

export function SuggestionCard({
  suggestion,
  onResolved,
}: {
  suggestion: AiSuggestion;
  onResolved: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(suggestion.suggested_title);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    suggestion.suggested_due_date
      ? parseISO(suggestion.suggested_due_date)
      : undefined
  );

  function handleConfirm() {
    startTransition(async () => {
      await confirmSuggestion(
        suggestion.id,
        title,
        dueDate ? format(dueDate, "yyyy-MM-dd") : null
      );
      onResolved(suggestion.id);
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissSuggestion(suggestion.id);
      onResolved(suggestion.id);
    });
  }

  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(false);
                if (e.key === "Escape") {
                  setTitle(suggestion.suggested_title);
                  setEditing(false);
                }
              }}
              onBlur={() => setEditing(false)}
              autoFocus
              className="h-8 text-sm"
            />
          ) : (
            <p
              className="cursor-pointer truncate font-medium hover:text-primary"
              onClick={() => setEditing(true)}
              title="Click to edit"
            >
              {title}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <DatePicker
              date={dueDate}
              onSelect={setDueDate}
              placeholder="Add due date"
              className="h-6 text-xs"
            />
            {dueDate && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDueDate(undefined)}
                title="Remove due date"
              >
                <X className="size-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={isPending || editing}
            title="Edit suggestion"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleConfirm}
            disabled={isPending || !title.trim()}
            title="Add as task"
          >
            <Check className="size-4 text-green-600" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isPending}
            title="Dismiss"
          >
            <X className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
