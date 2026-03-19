"use client";

import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const posthog = usePostHog();

  async function handleLogout() {
    posthog?.reset();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleLogout}>
      Log out
    </Button>
  );
}
