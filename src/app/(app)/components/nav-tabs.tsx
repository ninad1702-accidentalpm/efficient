"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  StickyNote,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "To-do", href: "/", icon: CheckSquare },
  { label: "Scratch pad", href: "/scratch-pad", icon: StickyNote },
  { label: "Summary", href: "/summary", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface NavTabsProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function NavTabs({ userEmail, onLogout }: NavTabsProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Mobile bottom nav (below lg) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-white/[0.06] bg-background lg:flex">
        {/* App name */}
        <div className="px-5 py-6">
          <h1 className="text-lg font-semibold tracking-tight">Efficient</h1>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                <item.icon className="size-4" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User email + logout pinned to bottom */}
        <div className="border-t border-white/[0.06] px-4 py-4">
          {userEmail && (
            <p className="mb-2 truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
