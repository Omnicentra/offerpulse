"use client";

import { useEffect, useState } from "react";

interface OfferPulseMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * OfferPulse animated lightning bolt mark
 * Inspired by Chargepilot aesthetic: clean, rounded, friendly, electric
 * Features continuous lightning pulse animation with glow
 */
export function OfferPulseMark({ 
  size = 32, 
  className = "",
  animated = true 
}: OfferPulseMarkProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Animated gradient for lightning sweep effect */}
        {shouldAnimate && (
          <linearGradient
            id="lightning-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="hsl(243, 95%, 66%)">
              <animate
                attributeName="stop-color"
                values="hsl(243, 95%, 66%); hsl(243, 95%, 80%); hsl(243, 95%, 66%)"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="hsl(243, 95%, 80%)">
              <animate
                attributeName="offset"
                values="0; 1; 0"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="hsl(243, 95%, 66%)">
              <animate
                attributeName="stop-color"
                values="hsl(243, 95%, 66%); hsl(243, 95%, 80%); hsl(243, 95%, 66%)"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}

        {/* Glow filter */}
        <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="hsl(243, 95%, 66%)" floodOpacity="0.5" />
          <feComposite in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          {shouldAnimate && (
            <animate
              attributeName="stdDeviation"
              values="2; 3; 2"
              dur="1.2s"
              repeatCount="indefinite"
            />
          )}
        </filter>
      </defs>

      {/* Lightning bolt path - rounded, friendly, modern (Chargepilot style) */}
      <path
        d="M13.5 2C13.8 2 14 2.3 13.9 2.6L11.8 9H17C17.4 9 17.6 9.4 17.4 9.7L9.4 21.7C9.1 22.1 8.5 21.9 8.6 21.4L10.2 15H5C4.6 15 4.4 14.6 4.6 14.3L12.6 2.3C12.8 2.1 13.2 2 13.5 2Z"
        fill={shouldAnimate ? "url(#lightning-gradient)" : "hsl(243, 95%, 66%)"}
        filter={shouldAnimate ? "url(#lightning-glow)" : undefined}
        strokeWidth="0"
      />
    </svg>
  );
}
