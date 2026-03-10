"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavTabs } from "./nav-tabs";

interface NavWrapperProps {
  userEmail?: string;
}

export function NavWrapper({ userEmail }: NavWrapperProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <NavTabs userEmail={userEmail} onLogout={handleLogout} />;
}
