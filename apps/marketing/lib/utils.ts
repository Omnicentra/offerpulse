import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract domain from a URL string
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export type PageTypeSlug = "product" | "collection" | "cart" | "home" | "other"

/**
 * Determine page type slug from URL path (for API response)
 */
export function getPageTypeSlug(url: string): PageTypeSlug {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname.toLowerCase()

    if (path === "/" || path === "") return "home"
    if (path.includes("/products/")) return "product"
    if (path.includes("/collections/")) return "collection"
    if (path.includes("/cart")) return "cart"
    if (path.includes("/checkout")) return "cart"

    return "other"
  } catch {
    return "other"
  }
}

/**
 * Human-readable page type for display
 */
export function getPageTypeDisplay(slug: PageTypeSlug): string {
  const map: Record<PageTypeSlug, string> = {
    home: "Homepage",
    product: "Product page",
    collection: "Collection page",
    cart: "Cart page",
    other: "Other",
  }
  return map[slug] ?? "Other"
}

/**
 * Determine page type from URL path (naive heuristic) — display version
 */
export function getPageType(url: string): string {
  return getPageTypeDisplay(getPageTypeSlug(url))
}

/**
 * Format date to UK locale
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Format timestamp
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}
