import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { NavTabs } from "./components/nav-tabs";
import { PushNotificationManager } from "./components/push-notification-manager";
import { TimezoneSync } from "./components/timezone-sync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4">
      <header className="flex items-center justify-between border-b border-white/[0.06] py-5">
        <h1 className="text-xl font-semibold tracking-tight">Efficient</h1>
        <LogoutButton />
      </header>
      <TimezoneSync />
      <PushNotificationManager />
      <NavTabs />
      <main className="py-6">{children}</main>
    </div>
  );
}
