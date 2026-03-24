"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don\u2019t match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("Something went wrong. Please try again or request a new reset link.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
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
              href="/login"
              className="font-[family-name:var(--font-barlow)] text-xs text-[#9A9A9A] transition-colors hover:text-[#1A1A1A]"
            >
              &larr; Back to login
            </Link>
          </div>

          {success ? (
            <>
              <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2rem] font-900 uppercase leading-none text-[#1A1A1A]">
                Password updated
              </h2>
              <div className="mt-6 rounded-lg bg-[#C9A227]/10 p-4">
                <p className="font-[family-name:var(--font-barlow)] text-sm text-[#6B6B6B]">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
              </div>
              <p className="mt-6 text-center">
                <Link
                  href="/login"
                  className="font-[family-name:var(--font-barlow)] text-sm font-medium text-[#C9A227] underline underline-offset-2 hover:text-[#B89220]"
                >
                  Go to login
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-[family-name:var(--font-barlow-condensed)] text-[2rem] font-900 uppercase leading-none text-[#1A1A1A]">
                Set new password
              </h2>
              <p className="mt-1 font-[family-name:var(--font-barlow)] text-sm text-[#9A9A9A]">
                Choose a new password for your account.
              </p>

              <form onSubmit={handleReset} autoComplete="off" className="mt-6 space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    New password (min 8 characters)
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="font-[family-name:var(--font-barlow)] text-xs font-medium uppercase tracking-wider text-[#6B6B6B]">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-[#D8D4CC] bg-white px-3 font-[family-name:var(--font-barlow)] text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-[#1A1A1A] font-[family-name:var(--font-barlow)] text-sm font-medium text-[#F5F2EB] transition-colors hover:bg-[#333] disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}

          {/* Card footer */}
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
