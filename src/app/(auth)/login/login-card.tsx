"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine initial mode from query params
  const initialMode = searchParams.get("mode") === "signup" || searchParams.get("email") ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Pre-fill email from query param
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setSignupEmail(emailParam);
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError("Please enter your email.");
      setLoginLoading(false);
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      setLoginLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setLoginError("Invalid email or password. Please try again.");
      setLoginLoading(false);
      return;
    }

    router.push("/today");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError(null);

    const email = signupEmail.trim();
    if (!email) {
      setSignupError("Please enter your email.");
      setSignupLoading(false);
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      setSignupLoading(false);
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords don\u2019t match.");
      setSignupLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: signupPassword,
    });

    if (error) {
      console.error("Signup error:", error.message, error);
      const msg = error.message.toLowerCase();
      if (msg.includes("user already registered")) {
        setSignupError("An account with this email already exists. Try logging in instead.");
      } else if (msg.includes("rate limit")) {
        setSignupError("Too many signup attempts. Please try again later.");
      } else if (msg.includes("signups not allowed")) {
        setSignupError("Signups are currently disabled.");
      } else {
        setSignupError("Something went wrong. Please check your details and try again.");
      }
      setSignupLoading(false);
      return;
    }

    setSignupLoading(false);
    router.push("/today");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);

    const email = forgotEmail.trim();
    if (!email) {
      setForgotError("Please enter your email.");
      setForgotLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setForgotError("Something went wrong. Please try again.");
      setForgotLoading(false);
      return;
    }

    setForgotLoading(false);
    setForgotSuccess(true);
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex items-start justify-center sm:items-center">
      <div
        className="w-full max-w-[480px] overflow-y-auto"
        style={{ animation: "fadeIn 0.5s ease-out both" }}
      >
        <div className="px-6 pb-8 pt-8 sm:px-8 sm:pt-10">
          {/* Card header */}
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="font-[family-name:var(--font-cormorant)] text-xl italic text-[#1A1A1A]">
              Efficient
            </Link>
            <Link
              href="/"
              className="font-[family-name:var(--font-barlow)] text-xs text-[#9A9A9A] transition-colors hover:text-[#1A1A1A]"
            >
              &larr; Back to home
            </Link>
          </div>

          {mode === "forgot" ? (
            forgotSuccess ? (
              <>
                {/* ── Forgot password success ── */}
                <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2rem] font-900 uppercase leading-none text-[#1A1A1A]">
                  Check your email
                </h2>
                <div className="mt-6 rounded-lg bg-[#C9A227]/10 p-4">
                  <p className="font-[family-name:var(--font-barlow)] text-sm text-[#6B6B6B]">
                    We sent a password reset link to <strong className="text-[#1A1A1A]">{forgotEmail}</strong>.
                    Click the link to set a new password.
                  </p>
                </div>
                <p className="mt-6 text-center font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                  <button
                    onClick={() => { setForgotSuccess(false); setForgotEmail(""); setMode("login"); }}
                    className="font-medium text-[#C9A227] underline underline-offset-2 hover:text-[#B89220]"
                  >
                    &larr; Back to login
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* ── Forgot password form ── */}
                <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2rem] font-900 uppercase leading-none text-[#1A1A1A]">
                  Reset password
                </h2>
                <p className="mt-1 font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                  Enter your email and we&apos;ll send a reset link.
                </p>

                <form onSubmit={handleForgotPassword} autoComplete="off" className="mt-6 space-y-4">
                  {forgotError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {forgotError}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] placeholder:text-[#B0ACA4] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="h-11 w-full rounded-lg bg-[#1A1A1A] font-[family-name:var(--font-barlow)] text-sm font-medium text-[#F5F2EB] transition-colors hover:bg-[#333] disabled:opacity-60"
                  >
                    {forgotLoading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <p className="mt-6 text-center font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                  <button
                    onClick={() => { setForgotError(null); setMode("login"); }}
                    className="font-medium text-[#C9A227] underline underline-offset-2 hover:text-[#B89220]"
                  >
                    &larr; Back to login
                  </button>
                </p>
              </>
            )
          ) : mode === "login" ? (
            <>
              {/* ── Login section ── */}
              <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2rem] font-900 uppercase leading-none text-[#1A1A1A]">
                Log in
              </h2>
              <p className="mt-1 font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                Welcome back.
              </p>

              <form onSubmit={handleLogin} autoComplete="off" className="mt-6 space-y-4">
                {loginError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {loginError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] placeholder:text-[#B0ACA4] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(loginEmail); setMode("forgot"); }}
                      className="font-[family-name:var(--font-barlow)] text-xs text-[#B0ACA4] transition-colors hover:text-[#C9A227]"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="h-11 w-full rounded-lg bg-[#1A1A1A] font-[family-name:var(--font-barlow)] text-sm font-medium text-[#F5F2EB] transition-colors hover:bg-[#333] disabled:opacity-60"
                >
                  {loginLoading ? "Logging in..." : "Log in"}
                </button>
              </form>

              <p className="mt-6 text-center font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-medium text-[#C9A227] underline underline-offset-2 hover:text-[#B89220]"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              {/* ── Signup section ── */}
              <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2rem] font-900 uppercase leading-none text-[#1A1A1A]">
                Sign up
              </h2>
              <p className="mt-1 font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                Free, always.
              </p>

              <form onSubmit={handleSignup} autoComplete="off" className="mt-6 space-y-4">
                {signupError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {signupError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="signup-email" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] placeholder:text-[#B0ACA4] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Password (min 8 characters)
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="signup-confirm" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm"
                    type="password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="h-11 w-full rounded-lg bg-[#C9A227] font-[family-name:var(--font-barlow)] text-sm font-medium text-white transition-colors hover:bg-[#B89220] disabled:opacity-60"
                >
                  {signupLoading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-center font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-medium text-[#C9A227] underline underline-offset-2 hover:text-[#B89220]"
                >
                  Log in
                </button>
              </p>
            </>
          )}

          {/* ── Card footer ── */}
          <div className="mt-10 border-t border-[#E0DCD4] pt-6 text-center">
            <p className="font-[family-name:var(--font-barlow)] text-xs text-[#B0ACA4]">
              &copy; 2026 Efficient &middot; Privacy &middot; Terms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
