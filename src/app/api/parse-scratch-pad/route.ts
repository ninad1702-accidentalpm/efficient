import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPostHogServer } from "@/lib/posthog-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { content, lastProcessedContent } = await request.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Diff: if lastProcessedContent is a prefix of content, only send the new part
  let textToProcess = content;
  if (
    lastProcessedContent &&
    content.startsWith(lastProcessedContent) &&
    content.length > lastProcessedContent.length
  ) {
    textToProcess = content.slice(lastProcessedContent.length).trim();
  }

  if (textToProcess.trim().length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are a task extraction assistant. Extract actionable tasks from the following free-form text. For each task, provide a concise title and an optional due date (YYYY-MM-DD format) if one is mentioned or can be reasonably inferred.

Today's date is ${today}.

Rules:
- Only extract clear, actionable tasks
- Keep titles concise but descriptive (under 80 characters)
- Only include a due_date if one is explicitly mentioned or strongly implied
- If a relative date is mentioned (e.g. "tomorrow", "next week", "Friday"), convert it to an absolute date based on today
- Return an empty array if no actionable tasks are found
- Do NOT include observations, ideas, or vague statements as tasks

Return ONLY a valid JSON array with objects containing "title" (string), "due_date" (string YYYY-MM-DD or null), and "source_text" (the exact words/sentence from the input that this task was extracted from — copy it verbatim). No other text.

Text to analyze:
"""
${textToProcess}
"""`;

  const ph = getPostHogServer();
  const aiStart = performance.now();

  ph.capture({
    distinctId: user.id,
    event: "scratch_pad_ai_request",
    properties: { text_length: textToProcess.length },
  });

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenRouter API error:", res.status, err);
      ph.capture({
        distinctId: user.id,
        event: "scratch_pad_ai_error",
        properties: { error: "AI service error", status_code: res.status },
      });
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = responseText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const suggestions = JSON.parse(jsonStr);

    if (!Array.isArray(suggestions)) {
      return NextResponse.json({ suggestions: [] });
    }

    // Filter out exact duplicates (same title + same due date) against active tasks only
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("title, due_date")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .is("archived_at", null);

    const existingKeys = new Set(
      (existingTasks ?? []).map((t: { title: string; due_date: string | null }) =>
        `${t.title.toLowerCase().trim()}|${t.due_date ?? ""}`
      )
    );

    const newSuggestions = suggestions.filter(
      (s: { title: string; due_date: string | null }) =>
        !existingKeys.has(`${s.title.toLowerCase().trim()}|${s.due_date ?? ""}`)
    );

    if (newSuggestions.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Save suggestions to DB
    const rows = newSuggestions.map(
      (s: { title: string; due_date: string | null; source_text?: string }) => ({
        user_id: user.id,
        suggested_title: s.title,
        suggested_due_date: s.due_date || null,
        source_text: s.source_text || textToProcess,
        user_action: null,
        task_id: null,
      })
    );

    const { data: saved } = await supabase
      .from("ai_suggestions")
      .insert(rows)
      .select();

    const duplicatesFiltered = suggestions.length - newSuggestions.length;

    ph.capture({
      distinctId: user.id,
      event: "scratch_pad_ai_response",
      properties: {
        duration_ms: Math.round(performance.now() - aiStart),
        suggestion_count: newSuggestions.length,
        duplicates_filtered: duplicatesFiltered,
      },
    });

    return NextResponse.json({ suggestions: saved ?? [] });
  } catch (error) {
    console.error("AI parsing error:", error);
    ph.capture({
      distinctId: user.id,
      event: "scratch_pad_ai_error",
      properties: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return NextResponse.json(
      { error: "Failed to parse content with AI" },
      { status: 500 }
    );
  }
}
