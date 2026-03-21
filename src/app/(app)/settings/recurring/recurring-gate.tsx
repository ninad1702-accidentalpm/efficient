"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFeatureFlag } from "@/lib/use-feature-flag";

export function RecurringGate({ children }: { children: React.ReactNode }) {
  const enabled = useFeatureFlag("recurring-tasks");
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      router.replace("/settings");
    }
  }, [enabled, router]);

  if (!enabled) return null;

  return <>{children}</>;
}
