"use client"

import { cn } from "@offerpulse/lib/utils"

interface GradientBlobProps {
  className?: string
  /** Size in pixels (default 600) */
  size?: number
  /** Opacity (default 0.4) */
  opacity?: number
}

export function GradientBlob({
  className,
  size = 600,
  opacity = 0.4,
}: GradientBlobProps) {
  return (
    <div
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, rgba(99, 91, 255, ${opacity * 0.45}), rgba(47, 228, 171, ${opacity * 0.3}), rgba(255, 184, 107, ${opacity * 0.25}))`,
      }}
      aria-hidden
    />
  )
}
