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
}: {
  initialContent: string;
  initialLastProcessed: string | null;
  initialSuggestions: AiSuggestion[];
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
  const [leftoverSource, setLeftoverSource] = useState<"suggest" | "add" | null>(null);
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
          // Remove source_text of each added task, clean up artifacts
          let updated = latestContentRef.current;
          for (const s of newSuggestions) {
            if (s.source_text) {
              updated = updated.replace(s.source_text, "");
            }
          }
          updated = updated
            .replace(/\n{3,}/g, "\n\n")
            .replace(/^[\s\-•*\d.)]+$/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
          setContent(updated);
          latestContentRef.current = updated;
          setLeftoverSource(updated.length > 0 ? "add" : null);
          await saveScratchPad(updated);
        } else {
          setSuggestions((prev) => [...newSuggestions, ...prev]);
          posthog?.capture("scratch_pad_suggestions_shown", {
            count: newSuggestions.length,
          });
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
      setStatus("saving");
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveScratchPad(value);
          posthog?.capture("scratch_pad_autosave_completed", {
            content_length: value.length,
          });
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1000);
        } catch (err) {
          posthog?.capture("scratch_pad_autosave_failed", {
            error: err instanceof Error ? err.message : "Unknown error",
          });
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
    setLeftoverSource(null);
    parseContent(latestContentRef.current, lastProcessed);
  }

  function handleAddTasks() {
    posthog?.capture("scratch_pad_add_clicked", {
      content_length: latestContentRef.current.length,
    });
    setLeftoverSource(null);
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
    setLeftoverSource(null);
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
    setLeftoverSource(null);
    debouncedSave(value);
  }

  function handleResolved(id: string, accepted: boolean) {
    if (accepted) {
      // Remove the source text of the accepted suggestion from the scratch pad
      const suggestion = suggestions.find((s) => s.id === id);
      if (suggestion?.source_text) {
        setContent((prev) => {
          const updated = prev
            .replace(suggestion.source_text, "")
            .replace(/\n{3,}/g, "\n\n")
            // Remove lines that are only bullets, numbers, or punctuation remnants
            .replace(/^[\s\-•*\d.)]+$/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
          latestContentRef.current = updated;
          saveScratchPad(updated);
          setLeftoverSource(updated.length > 0 ? "suggest" : null);
          return updated;
        });
      }
    }
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
        <div className="flex items-center justify-end">
          <span className="text-xs text-muted-foreground">
            {statusText}
          </span>
        </div>
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
        </div>
        {addedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
            <CheckCircle2 className="size-4 shrink-0" />
            {addedCount} task{addedCount === 1 ? "" : "s"} added to your to-do list
          </div>
        )}
        {leftoverSource && content.trim().length > 0 && (
          <div className="rounded-lg border border-border px-4 py-3 text-xs text-muted-foreground">
            Some content wasn&apos;t turned into tasks — it may not contain clear action items.
            You can edit it, clear it, or try clicking on &quot;{leftoverSource === "add" ? "Add tasks" : "Suggest tasks"}&quot; again.
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
