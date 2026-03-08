import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

Return ONLY a valid JSON array with objects containing "title" (string) and "due_date" (string YYYY-MM-DD or null). No other text.

Text to analyze:
"""
${textToProcess}
"""`;

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

    // Filter out tasks that already exist or have pending/accepted suggestions
    const [{ data: existingTasks }, { data: existingSuggestions }] = await Promise.all([
      supabase
        .from("tasks")
        .select("title")
        .eq("user_id", user.id),
      supabase
        .from("ai_suggestions")
        .select("suggested_title")
        .eq("user_id", user.id)
        .in("user_action", ["accepted"]),
    ]);

    const existingTitles = new Set([
      ...(existingTasks ?? []).map((t: { title: string }) => t.title.toLowerCase().trim()),
      ...(existingSuggestions ?? []).map((s: { suggested_title: string }) => s.suggested_title.toLowerCase().trim()),
    ]);

    const newSuggestions = suggestions.filter(
      (s: { title: string }) => !existingTitles.has(s.title.toLowerCase().trim())
    );

    if (newSuggestions.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Save suggestions to DB
    const rows = newSuggestions.map(
      (s: { title: string; due_date: string | null }) => ({
        user_id: user.id,
        suggested_title: s.title,
        suggested_due_date: s.due_date || null,
        source_text: textToProcess,
        user_action: null,
        task_id: null,
      })
    );

    const { data: saved } = await supabase
      .from("ai_suggestions")
      .insert(rows)
      .select();

    return NextResponse.json({ suggestions: saved ?? [] });
  } catch (error) {
    console.error("AI parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse content with AI" },
      { status: 500 }
    );
  }
}
