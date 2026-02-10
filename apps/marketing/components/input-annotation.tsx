"use client"

import { useEffect, useState } from "react"

interface InputAnnotationProps {
  text?: string
  className?: string
}

/**
 * Premium hand-drawn annotation with squiggly arrow
 * Points to the competitor URL input in hero
 */
export function InputAnnotation({ 
  text = "Enter your competitor URL here",
  className = ""
}: InputAnnotationProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return (
    <div 
      className={`absolute left-0 -top-12 z-20 sm:-left-4 sm:-top-16 ${className}`}
      style={{ 
        animation: prefersReducedMotion ? 'none' : 'float 3s ease-in-out infinite' 
      }}
    >
      {/* Label badge */}
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface/90 px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-sm">
        <span>{text}</span>
      </div>

      {/* Squiggly arrow SVG */}
      <svg
        width="140"
        height="65"
        viewBox="0 0 140 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="ml-8"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(91, 90, 247, 0.1))'
        }}
      >
        {/* Squiggly line with draw animation */}
        <path
          d="M10 5 Q20 2, 30 8 T50 12 Q65 10, 75 18 T90 28 Q100 35, 105 45 L108 55"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-primary/40"
          strokeDasharray={prefersReducedMotion ? "none" : "200"}
          strokeDashoffset={prefersReducedMotion ? "0" : "200"}
          style={{
            animation: prefersReducedMotion ? 'none' : 'draw 1.5s ease-out forwards'
          }}
        />
        
        {/* Arrow head */}
        <path
          d="M104 51 L108 55 L110 50"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-primary/40"
          style={{
            opacity: prefersReducedMotion ? 1 : 0,
            animation: prefersReducedMotion ? 'none' : 'fadeIn 0.3s ease-out 1.2s forwards'
          }}
        />
      </svg>
    </div>
  )
}
