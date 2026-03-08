"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ListPlus, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SuggestionCard } from "./suggestion-card";
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
  const [content, setContent] = useState(initialContent);
  const [lastProcessed, setLastProcessed] = useState(initialLastProcessed);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "parsing" | "adding">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isParsingRef = useRef(false);
  const latestContentRef = useRef(content);

  // Keep latestContentRef in sync so the parse callback sees the latest value
  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  const [addedCount, setAddedCount] = useState(0);

  async function parseContent(savedContent: string, currentLastProcessed: string | null, autoAdd = false) {
    // Skip if content is empty or a parse is already running
    if (!savedContent.trim()) return;
    if (isParsingRef.current) return;

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
          // Automatically confirm each suggestion as a task
          for (const s of newSuggestions) {
            await confirmSuggestion(s.id, s.suggested_title, s.suggested_due_date);
          }
          setAddedCount(newSuggestions.length);
          setTimeout(() => setAddedCount(0), 3000);
        } else {
          setSuggestions((prev) => [...newSuggestions, ...prev]);
        }
      }

      if (autoAdd) {
        await updateLastProcessed(savedContent);
        setLastProcessed(savedContent);
      }
    } catch (error) {
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
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1000);
        } catch {
          setStatus("idle");
        }
      }, 1000);
    },
    []
  );

  function handleSuggestTasks() {
    parseContent(latestContentRef.current, lastProcessed);
  }

  function handleAddTasks() {
    parseContent(latestContentRef.current, lastProcessed, true);
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
          placeholder="Dump your thoughts here... meetings, ideas, things to do. Use 'Suggest tasks' to review before adding, or 'Add tasks' to send them straight to your to-do list."
          className="min-h-[300px] resize-y"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSuggestTasks}
            disabled={status === "parsing" || status === "adding" || status === "saving" || !content.trim()}
            size="sm"
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {status === "parsing" ? "Looking for tasks..." : "Suggest tasks"}
          </Button>
          <Button
            onClick={handleAddTasks}
            disabled={status === "parsing" || status === "adding" || status === "saving" || !content.trim()}
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            <ListPlus className="size-3.5" />
            {status === "adding" ? "Adding tasks..." : "Add tasks"}
          </Button>
          {addedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {addedCount} task{addedCount === 1 ? "" : "s"} added
            </span>
          )}
        </div>
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
    </div>
  );
}
