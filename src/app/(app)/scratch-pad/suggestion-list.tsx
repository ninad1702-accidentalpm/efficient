"use client";

import { useState } from "react";
import { SuggestionCard } from "./suggestion-card";
import type { AiSuggestion } from "@/lib/types";

export function SuggestionList({
  initialSuggestions,
}: {
  initialSuggestions: AiSuggestion[];
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);

  function handleResolved(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  function addSuggestions(newSuggestions: AiSuggestion[]) {
    setSuggestions((prev) => [...newSuggestions, ...prev]);
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
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
  );
}

// Export the addSuggestions function type for the parent to use via ref
export type SuggestionListHandle = {
  addSuggestions: (suggestions: AiSuggestion[]) => void;
};
