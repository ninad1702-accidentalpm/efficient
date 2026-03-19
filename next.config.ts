import type { NextConfig } from "next";

console.log("[BUILD] NEXT_PUBLIC_POSTHOG_KEY:", process.env.NEXT_PUBLIC_POSTHOG_KEY ? "SET" : "NOT SET");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
};

export default nextConfig;
