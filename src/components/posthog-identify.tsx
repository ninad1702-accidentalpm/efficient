"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogIdentify({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string | undefined;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog && userId) {
      posthog.identify(userId, { email: userEmail });
    }
  }, [posthog, userId, userEmail]);

  return null;
}
