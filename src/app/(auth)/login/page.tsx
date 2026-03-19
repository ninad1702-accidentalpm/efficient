"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      {/* Left branding column — desktop only */}
      <div className="hidden lg:flex lg:w-[40%] items-center justify-center bg-[var(--bg-surface)]">
        <div className="text-center">
          <h1 className="font-display text-[3rem] text-[var(--text-primary)]">Efficient</h1>
          <p className="mt-2 text-[var(--text-muted)]">Your day, organised.</p>
        </div>
      </div>

      {/* Right form column */}
      <div className="flex flex-1 items-center justify-center px-4 bg-[var(--bg-base)]">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-center font-display text-[2rem] text-[var(--text-primary)] lg:hidden">Efficient</h1>
          <div>
            <h2 className="text-2xl font-medium text-[var(--text-primary)]">Log in</h2>
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
  );
}
