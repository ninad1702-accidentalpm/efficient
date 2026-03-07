import { createClient } from "@/lib/supabase/server";
import { ScratchPadEditor } from "./scratch-pad-editor";
import type { AiSuggestion } from "@/lib/types";

export default async function ScratchPadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch scratch pad content (or create empty one)
  const { data: scratchPad } = await supabase
    .from("scratch_pad")
    .select("content, last_processed_content")
    .eq("user_id", user.id)
    .single();

  // Fetch pending AI suggestions (not yet accepted/dismissed)
  const { data: suggestions } = await supabase
    .from("ai_suggestions")
    .select("*")
    .eq("user_id", user.id)
    .is("user_action", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <ScratchPadEditor
        initialContent={scratchPad?.content ?? ""}
        initialLastProcessed={scratchPad?.last_processed_content ?? null}
        initialSuggestions={(suggestions as AiSuggestion[]) ?? []}
      />
    </div>
  );
}
