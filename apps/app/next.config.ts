import "./env";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ["@offerpulse/lib", "@offerpulse/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.offerpulse.com",
      },
    ],
  },
  async rewrites() {
    return [
      // PostHog proxy: neutral path to avoid ad-blocker blocklists (/ingest is often blocked)
      {
        source: "/_px/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/_px/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // Required for PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, {
  org: "omnicentra",
  project: "offerpulse-app",
  silent: true,
  widenClientFileUpload: true,
});
