"use client"

import { cn } from "@offerpulse/lib/utils"

interface PulseLineProps {
  className?: string
}

/** Subtle animated pulse line SVG behind product theatre (low opacity, slow) */
export function PulseLine({ className }: PulseLineProps) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full animate-pulse-line opacity-[0.12]", className)}
      viewBox="0 0 400 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        d="M 0 50 Q 50 20 100 50 T 200 50 T 300 50 T 400 50"
        fill="none"
        stroke="url(#pulseGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
