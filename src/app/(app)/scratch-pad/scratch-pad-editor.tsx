"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { CheckCircle2, ListPlus, Sparkles, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuggestionCard } from "./suggestion-card";
import { toast } from "sonner";
import { saveScratchPad, updateLastProcessed, confirmSuggestion } from "@/lib/actions/scratch-pad";
import type { AiSuggestion } from "@/lib/types";

export function ScratchPadEditor({
  initialContent,
  initialLastProcessed,
  initialSuggestions,
  clearOnParse,
}: {
  initialContent: string;
  initialLastProcessed: string | null;
  initialSuggestions: AiSuggestion[];
  clearOnParse: boolean;
}) {
  const posthog = usePostHog();
  const [content, setContent] = useState(initialContent);
  const [lastProcessed, setLastProcessed] = useState(initialLastProcessed);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "parsing" | "adding">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isParsingRef = useRef(false);
  const latestContentRef = useRef(content);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const clearConfirmedRef = useRef(false);

  // Keep latestContentRef in sync so the parse callback sees the latest value
  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  const [addedCount, setAddedCount] = useState(0);

  async function parseContent(savedContent: string, currentLastProcessed: string | null, autoAdd = false) {
    // Skip if content is empty or a parse is already running
    if (!savedContent.trim()) return;
    if (isParsingRef.current) return;

    const mode = autoAdd ? "add" : "suggest";
    const parseStart = performance.now();
    posthog?.capture("scratch_pad_parse_started", {
      mode,
      content_length: savedContent.length,
    });

    isParsingRef.current = true;
    setStatus(autoAdd ? "adding" : "parsing");
    try {
      const res = await fetch("/api/parse-scratch-pad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: savedContent,
          lastProcessedContent: autoAdd ? currentLastProcessed : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse");
      }

      const { suggestions: newSuggestions } = await res.json();

      if (newSuggestions && newSuggestions.length > 0) {
        if (autoAdd) {
          // Automatically confirm all suggestions in parallel
          await Promise.all(
            newSuggestions.map((s: AiSuggestion) =>
              confirmSuggestion(s.id, s.suggested_title, s.suggested_due_date)
            )
          );
          const addDuration = performance.now() - parseStart;
          posthog?.capture("scratch_pad_tasks_auto_added", {
            count: newSuggestions.length,
            duration_ms: Math.round(addDuration),
          });
          setAddedCount(newSuggestions.length);
          setTimeout(() => setAddedCount(0), 3000);
          if (clearOnParse) {
            setContent("");
            latestContentRef.current = "";

            await saveScratchPad("");
          }
        } else {
          setSuggestions((prev) => [...newSuggestions, ...prev]);
          posthog?.capture("scratch_pad_suggestions_shown", {
            count: newSuggestions.length,
          });
          if (clearOnParse) {
            setContent("");
            latestContentRef.current = "";

            await saveScratchPad("");
          }
        }
      }

      posthog?.capture("scratch_pad_parse_completed", {
        mode,
        duration_ms: Math.round(performance.now() - parseStart),
        suggestion_count: newSuggestions?.length ?? 0,
      });

      if (autoAdd) {
        await updateLastProcessed(savedContent);
        setLastProcessed(savedContent);
      }
    } catch (error) {
      posthog?.capture("scratch_pad_parse_failed", {
        mode,
        duration_ms: Math.round(performance.now() - parseStart),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Couldn't extract tasks. Please try again.");
      console.error("Parse error:", error);
    } finally {
      isParsingRef.current = false;
      setStatus("idle");
    }
  }

  // Debounced auto-save (no auto-parse — user triggers parsing via button)
  const debouncedSave = useCallback(
    (value: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        setStatus("saving");
        try {
          const result = await saveScratchPad(value);
          if (!result.success) {
            toast.error(result.error);
            setStatus("idle");
            return;
          }
          posthog?.capture("scratch_pad_autosave_completed", {
            content_length: value.length,
          });
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1000);
        } catch {
          // Transient failure (e.g. dev server hot-reload) — retry once
          try {
            const retry = await saveScratchPad(value);
            if (retry.success) {
              setStatus("saved");
              setTimeout(() => setStatus("idle"), 1000);
              return;
            }
          } catch {
            // retry also failed
          }
          toast.error("Your changes couldn't be saved.");
          setStatus("idle");
        }
      }, 1000);
    },
    [posthog]
  );

  function handleSuggestTasks() {
    posthog?.capture("scratch_pad_suggest_clicked", {
      content_length: latestContentRef.current.length,
    });

    parseContent(latestContentRef.current, lastProcessed);
  }

  function handleAddTasks() {
    posthog?.capture("scratch_pad_add_clicked", {
      content_length: latestContentRef.current.length,
    });

    parseContent(latestContentRef.current, lastProcessed, true);
  }

  async function handleClearConfirm() {
    posthog?.capture("scratch_pad_clear_confirmed", {
      content_length: content.length,
      suggestion_count: suggestions.length,
    });
    clearConfirmedRef.current = true;
    setClearDialogOpen(false);
    setContent("");
    latestContentRef.current = "";

    await saveScratchPad("");
    await updateLastProcessed("");
    setLastProcessed("");
    setSuggestions([]);
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setContent(value);

    debouncedSave(value);
  }

  function handleResolved(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  const isBusy = status === "parsing" || status === "adding" || status === "saving";

  const statusText =
    status === "saving"
      ? "Saving..."
      : status === "saved"
        ? "Saved"
        : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          id="scratch-pad"
          value={content}
          onChange={handleChange}
          placeholder="Capture now, organise later. Jot anything down and convert it to tasks when you're ready."
          className="min-h-[280px] resize-y bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-[0.9rem] leading-[1.7] p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent)]"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSuggestTasks}
            disabled={isBusy || !content.trim()}
            className="gap-1.5 bg-[var(--accent)] text-[var(--accent-fg)] text-[0.85rem] font-medium rounded-lg"
          >
            <Sparkles className="size-3.5" />
            {status === "parsing" ? "Looking for tasks..." : "Suggest tasks"}
          </Button>
          <Button
            onClick={handleAddTasks}
            disabled={isBusy || !content.trim()}
            variant="outline"
            className="gap-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--accent)]"
          >
            <ListPlus className="size-3.5" />
            {status === "adding" ? "Adding tasks..." : "Add tasks"}
          </Button>
          <Button
            onClick={() => {
              posthog?.capture("scratch_pad_clear_clicked", {
                content_length: content.length,
                suggestion_count: suggestions.length,
              });
              setClearDialogOpen(true);
            }}
            disabled={!content.trim() || isBusy}
            variant="outline"
            className="gap-1.5 bg-transparent border-[var(--border)] text-[var(--text-muted)] rounded-lg hover:border-[#E85547] hover:text-[#E85547]"
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
          {statusText && (
            <span className="text-xs text-muted-foreground ml-auto">
              {statusText}
            </span>
          )}
        </div>
        {addedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
            <CheckCircle2 className="size-4 shrink-0" />
            {addedCount} task{addedCount === 1 ? "" : "s"} added to your to-do list
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            AI Suggestions ({suggestions.length})
          </h2>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={clearDialogOpen}
        onOpenChange={(open) => {
          if (!open && !clearConfirmedRef.current) {
            posthog?.capture("scratch_pad_clear_cancelled");
          }
          clearConfirmedRef.current = false;
          setClearDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Clear your scratch pad?</DialogTitle>
            <DialogDescription>
              This will remove all text and suggestions. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearConfirm}>
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
