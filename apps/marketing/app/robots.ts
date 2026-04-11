import { MetadataRoute } from "next"
import { CANONICAL_BASE_URL } from "@/lib/seo/config"

export default function robots(): MetadataRoute.Robots {
  return {
    host: CANONICAL_BASE_URL,
    sitemap: `${CANONICAL_BASE_URL}/sitemap.xml`,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/_next/", "/node_modules/"],
      },
    ],
  }
}
