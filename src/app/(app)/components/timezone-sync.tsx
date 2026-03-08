"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/lib/actions/profile";

export function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      syncTimezone(tz);
    }
  }, []);

  return null;
}
