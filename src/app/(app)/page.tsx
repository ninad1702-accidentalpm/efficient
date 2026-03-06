import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">Welcome to Efficient</h1>
      <p className="text-muted-foreground">
        Signed in as {user?.email}
      </p>
      <LogoutButton />
    </div>
  );
}
