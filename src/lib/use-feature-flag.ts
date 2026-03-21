"use client";

import { usePostHog } from "posthog-js/react";

/**
 * Returns whether a PostHog feature flag is enabled.
 * When PostHog isn't loaded (e.g. local dev without a key), defaults to `true`
 * so that gated features remain visible during development.
 */
export function useFeatureFlag(flag: string): boolean {
  const posthog = usePostHog();

  // PostHog not initialized (no key) — default to enabled
  if (!posthog?.__loaded) return true;

  return posthog.isFeatureEnabled(flag) ?? false;
}
