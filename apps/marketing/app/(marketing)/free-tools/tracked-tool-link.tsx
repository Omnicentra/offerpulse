"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { track } from "@/lib/analytics"

interface TrackedToolLinkProps {
  name: string
  slug: string
  isFeatured?: boolean
  children: React.ReactNode
}

/**
 * Client component that wraps the "Open tool" link and tracks
 * free_tool_opened when the user clicks.
 */
export function TrackedToolLink({ name, slug, isFeatured, children }: TrackedToolLinkProps) {
  return (
    <Button asChild className="w-full">
      <Link
        href={`/free-tools/${slug}`}
        onClick={() => {
          track("free_tool_opened", {
            tool_name: name,
            tool_slug: slug,
            is_featured: isFeatured ?? false,
          })
        }}
      >
        {children}
      </Link>
    </Button>
  )
}
