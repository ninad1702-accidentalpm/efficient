"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Scratch pad", href: "/scratch-pad" },
  { label: "To-do list", href: "/" },
  { label: "Task log", href: "/summary" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex rounded-full bg-surface p-1">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 text-center px-4 py-2 text-sm font-medium transition-colors rounded-full",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
