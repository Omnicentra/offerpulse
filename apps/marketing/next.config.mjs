/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@offerpulse/lib", "@offerpulse/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
      { protocol: "https", hostname: "cdn.offerpulse.com", pathname: "/**" },
      { protocol: "https", hostname: "api.producthunt.com", pathname: "/**" },
    ],
  },
  turbopack: {
    root: "../../",
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

export default nextConfig;
