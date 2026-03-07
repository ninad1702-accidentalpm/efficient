import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { NavTabs } from "./components/nav-tabs";
import { PushNotificationManager } from "./components/push-notification-manager";

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
      <header className="flex items-center justify-between border-b py-4">
        <h1 className="text-xl font-bold">Efficient</h1>
        <LogoutButton />
      </header>
      <PushNotificationManager />
      <NavTabs />
      <main className="py-6">{children}</main>
    </div>
  );
}
