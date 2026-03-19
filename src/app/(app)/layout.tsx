import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavWrapper } from "./components/nav-wrapper";
import { PushNotificationManager } from "./components/push-notification-manager";
import { TimezoneSync } from "./components/timezone-sync";
import { OnboardingModal } from "./components/onboarding-modal";
import { PostHogIdentify } from "@/components/posthog-identify";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return (
    <div className="min-h-screen">
      <PostHogIdentify userId={user.id} userEmail={user.email} />
      <TimezoneSync />
      <PushNotificationManager />
      <NavWrapper userEmail={user.email} />
      <OnboardingModal show={!onboardingCompleted} />

      {/* Main content: offset on desktop for sidebar, padded bottom on mobile for bottom nav */}
      <div className="lg:pl-56">
        <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
