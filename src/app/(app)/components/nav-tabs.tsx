"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  ListChecks,
  StickyNote,
  Settings,
  LogOut,
  Sun,
  Moon,
  MessageSquareMore,
} from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Today", href: "/", icon: CheckSquare, showInMobile: true },
  { label: "Task lists", href: "/task-lists", icon: ListChecks, showInMobile: true },
  { label: "Scratch pad", href: "/scratch-pad", icon: StickyNote, showInMobile: true },
  { label: "Settings", href: "/settings", icon: Settings, showInMobile: true },
];

interface NavTabsProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function NavTabs({ userEmail, onLogout }: NavTabsProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Mobile bottom nav (below lg) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around">
          {navItems.filter((item) => item.showInMobile).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop left sidebar (lg and above) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:flex">
        {/* App name */}
        <div className="px-5 py-6">
          <h1 className="font-display text-[1.4rem] text-[var(--text-primary)]">Efficient</h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2 text-[0.875rem] font-medium transition-colors",
                  active
                    ? "border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <item.icon className="size-4" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User email + theme toggle + logout pinned to bottom */}
        <div className="border-t border-[var(--border-subtle)] px-4 py-4">
          {userEmail && (
            <p className="mb-2 truncate text-[0.75rem] text-[var(--text-muted)]">
              {userEmail}
            </p>
          )}
          <FeedbackDialog>
            <Button
              variant="outline"
              className="mb-2 w-full justify-start gap-2 text-[0.8rem]"
            >
              <MessageSquareMore className="size-4" />
              Send feedback
            </Button>
          </FeedbackDialog>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-[0.75rem] text-[var(--text-muted)] transition-colors hover:text-destructive"
            >
              <LogOut className="size-4" />
              Log out
            </button>
            <button
              onClick={toggleTheme}
              className="relative ml-auto size-8 rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle theme"
            >
              <Sun
                className="absolute inset-0 m-auto size-4 transition-opacity duration-150"
                style={{ opacity: theme === "dark" ? 1 : 0 }}
              />
              <Moon
                className="absolute inset-0 m-auto size-4 transition-opacity duration-150"
                style={{ opacity: theme === "light" ? 1 : 0 }}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
