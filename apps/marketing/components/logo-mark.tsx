"use client";

import { cn } from "@offerpulse/lib/utils";

export type LogoMarkVariant = "pulse" | "broadcast" | "minimal" | "signal";

type LogoMarkProps = {
  variant?: LogoMarkVariant;
  className?: string;
  size?: 16 | 20 | 24 | 32;
  animated?: boolean;
};

const viewBox = "0 0 24 24";

// Improved bolt: more dynamic, angular, better balanced
const BOLT = "M13 2 L4 13 L10.5 13 L8 22 L20 9 L13.5 9 Z";

const paths = {
  // Pulse waves radiating from center (like a radar ping)
  pulse: (
    <>
      <path 
        d="M12 4 C7.58 4 4 7.58 4 12 C4 16.42 7.58 20 12 20" 
        opacity="0.2"
        strokeDasharray="3 2"
      />
      <path 
        d="M12 7 C9.24 7 7 9.24 7 12 C7 14.76 9.24 17 12 17" 
        opacity="0.4"
        strokeDasharray="2 1"
      />
      <path d={BOLT} fill="currentColor" stroke="none" />
    </>
  ),
  
  // Signal waves broadcasting outward (Wi-Fi style)
  broadcast: (
    <>
      <path d={BOLT} fill="currentColor" stroke="none" />
      <path d="M14.5 7 Q17 5.5 19 7.5" opacity="0.6" strokeWidth="1.5" />
      <path d="M15 11 Q18 10 20.5 12" opacity="0.5" strokeWidth="1.5" />
      <path d="M14.5 15 Q17 13.5 19 15.5" opacity="0.4" strokeWidth="1.5" />
    </>
  ),
  
  // Minimal: just the bolt (for small sizes/favicons)
  minimal: (
    <path d={BOLT} fill="currentColor" stroke="none" />
  ),
  
  // Signal bars growing (activity/strength indicator)
  signal: (
    <>
      <path d={BOLT} fill="currentColor" stroke="none" />
      <rect x="16" y="15" width="1.5" height="4" rx="0.5" opacity="0.3" />
      <rect x="18.5" y="13" width="1.5" height="6" rx="0.5" opacity="0.5" />
      <rect x="21" y="10" width="1.5" height="9" rx="0.5" opacity="0.7" />
    </>
  ),
};

export function LogoMark({
  variant = "pulse",
  className,
  size = 24,
  animated = false,
}: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "shrink-0",
        animated && variant === "pulse" && "animate-pulse-slow",
        className
      )}
      width={size}
      height={size}
      aria-hidden
    >
      {paths[variant]}
    </svg>
  );
}

/** 
 * App icon: rounded-rectangle with gradient, depth, and white mark.
 * Optimized for iOS/Android app icons and favicons.
 */
export function AppIcon({
  className,
  size = 24,
  variant = "default",
}: {
  className?: string;
  size?: number;
  variant?: "default" | "dark" | "light";
}) {
  const uniqueId = `app-icon-${variant}-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={cn("shrink-0", className)}
      width={size}
      height={size}
      aria-hidden
    >
      <defs>
        {/* Main gradient */}
        <linearGradient
          id={`${uniqueId}-gradient`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#635BFF" />
          <stop offset="50%" stopColor="#7C6FFF" />
          <stop offset="100%" stopColor="#2FE4AB" />
        </linearGradient>
        
        {/* Inner glow */}
        <radialGradient
          id={`${uniqueId}-glow`}
          cx="50%"
          cy="50%"
        >
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        
        {/* Subtle shadow */}
        <filter id={`${uniqueId}-shadow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background with gradient */}
      <rect
        width="24"
        height="24"
        rx="5.5"
        fill={`url(#${uniqueId}-gradient)`}
      />
      
      {/* Inner glow overlay */}
      <rect
        width="24"
        height="24"
        rx="5.5"
        fill={`url(#${uniqueId}-glow)`}
      />
      
      {/* Icon mark with shadow */}
      <g filter={`url(#${uniqueId}-shadow)`}>
        <path 
          d={BOLT}
          fill="white"
          opacity="0.95"
        />
      </g>
      
      {/* Subtle pulse rings */}
      <g opacity="0.15" stroke="white" fill="none" strokeWidth="1.5">
        <path 
          d="M12 6 C8.69 6 6 8.69 6 12 C6 15.31 8.69 18 12 18" 
          strokeDasharray="2 3"
        />
      </g>
    </svg>
  );
}
