"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrandingPanel, AuthFeaturesMobile } from "../components/auth-branding-panel";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <AuthBrandingPanel />

      {/* Right form column */}
      <div className="flex flex-1 justify-start pt-14 lg:items-center lg:justify-center lg:pt-0 px-4 bg-[var(--bg-base)]">
        <div className="w-full max-w-sm space-y-8 lg:space-y-6">
          <h1 className="text-center font-display text-[2.5rem] leading-none text-[var(--text-primary)] lg:hidden animate-in fade-in-0 slide-in-from-bottom-3 duration-500">Efficient</h1>
          <AuthFeaturesMobile />
          <div className="bg-[var(--bg-surface)] ring-1 ring-[var(--foreground)]/10 rounded-[10px] p-5 space-y-4 lg:bg-transparent lg:ring-0 lg:p-0 lg:rounded-none lg:space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 delay-500 fill-mode-backwards">
            <div className="text-center lg:text-left">
              <h2 className="text-xl lg:text-2xl font-medium text-[var(--text-primary)] font-display lg:font-sans">Log in</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Enter your email and password to sign in</p>
            </div>
            <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
              {error && (
                <div className="rounded-[10px] bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[var(--bg-surface)] border-[var(--border)] rounded-[10px] focus-visible:border-[var(--accent)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[var(--bg-surface)] border-[var(--border)] rounded-[10px] focus-visible:border-[var(--accent)]"
                />
              </div>
              <Button type="submit" className="w-full bg-[var(--accent)] text-[var(--accent-fg)] rounded-[10px] font-medium h-11" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-sm text-[var(--text-muted)] text-center">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[var(--accent)] underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
