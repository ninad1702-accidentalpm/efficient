"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SuggestionCard } from "./suggestion-card";
import { saveScratchPad, updateLastProcessed } from "@/lib/actions/scratch-pad";
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "parsing">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isParsingRef = useRef(false);
  const latestContentRef = useRef(content);

  // Keep latestContentRef in sync so the parse callback sees the latest value
  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  async function parseContent(savedContent: string, currentLastProcessed: string | null) {
    // Skip if content is empty, unchanged since last processed, or a parse is already running
    if (!savedContent.trim()) return;
    if (savedContent === currentLastProcessed) return;
    if (isParsingRef.current) return;

    isParsingRef.current = true;
    setStatus("parsing");
    try {
      const res = await fetch("/api/parse-scratch-pad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: savedContent,
          lastProcessedContent: currentLastProcessed,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse");
      }

      const { suggestions: newSuggestions } = await res.json();

      if (newSuggestions && newSuggestions.length > 0) {
        setSuggestions((prev) => [...newSuggestions, ...prev]);
      }

      await updateLastProcessed(savedContent);
      setLastProcessed(savedContent);
    } catch (error) {
      console.error("Parse error:", error);
    } finally {
      isParsingRef.current = false;
      setStatus("idle");
    }
  }

  // Debounced auto-save, then auto-parse
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
          // Chain auto-parse after successful save
          // Use the latest content and lastProcessed at the time of parse
          const currentContent = latestContentRef.current;
          // Small delay so "Saved" is visible briefly
          setTimeout(() => {
            setLastProcessed((prev) => {
              parseContent(currentContent, prev);
              return prev;
            });
          }, 400);
        } catch {
          setStatus("idle");
        }
      }, 1000);
    },
    []
  );

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
        : status === "parsing"
          ? "Looking for tasks..."
          : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="scratch-pad" className="text-sm font-medium">
            Jot down your thoughts
          </label>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {status === "parsing" && <Sparkles className="size-3 animate-pulse" />}
            {statusText}
          </span>
        </div>
        <Textarea
          id="scratch-pad"
          value={content}
          onChange={handleChange}
          placeholder="Dump your thoughts here... meetings, ideas, things to do. AI will extract actionable tasks for you."
          className="min-h-[200px] resize-y"
        />
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
