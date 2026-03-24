import { createClient } from "@/lib/supabase/server";
import { ScratchPadEditor } from "./scratch-pad-editor";
import type { AiSuggestion } from "@/lib/types";

export default async function ScratchPadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch scratch pad content, pending suggestions, and profile preference in parallel
  const [{ data: scratchPad }, { data: suggestions }, { data: profile }] = await Promise.all([
    supabase
      .from("scratch_pad")
      .select("content, last_processed_content")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("ai_suggestions")
      .select("*")
      .eq("user_id", user.id)
      .is("user_action", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("scratch_pad_clear_on_parse")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Scratch pad</h1>
      <ScratchPadEditor
        initialContent={scratchPad?.content ?? ""}
        initialLastProcessed={scratchPad?.last_processed_content ?? null}
        initialSuggestions={(suggestions as AiSuggestion[]) ?? []}
        clearOnParse={profile?.scratch_pad_clear_on_parse ?? true}
      />
    </div>
  );
}
