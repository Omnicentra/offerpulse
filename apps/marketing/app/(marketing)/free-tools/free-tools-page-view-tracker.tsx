"use client"

import { useEffect } from "react"
import { track } from "@/lib/analytics"

/**
 * Client component that tracks free-tools page view on mount.
 * Renders nothing; used only for analytics.
 */
export function FreeToolsPageViewTracker() {
  useEffect(() => {
    track("free_tools_page_viewed", {
      referrer: typeof window !== "undefined" ? document.referrer : undefined,
    })
  }, [])
  return null
}
