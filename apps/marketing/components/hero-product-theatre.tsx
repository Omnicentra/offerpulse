"use client"

import { OfferSnapshotCard } from "@/components/offer-snapshot-card"
import { MockAlert } from "@/components/mock-alert"
import { WeeklyDigestCard } from "@/components/weekly-digest-card"
import { PulseLine } from "@/components/pulse-line"
import { cn } from "@offerpulse/lib/utils"

interface HeroProductTheatreProps {
  domain?: string
  className?: string
}

export function HeroProductTheatre({ domain, className }: HeroProductTheatreProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[320px] w-full max-w-md items-end justify-center lg:min-h-[380px]",
        className
      )}
    >
      <PulseLine className="left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" />
      {/* Back layer: Weekly digest */}
      <div className="absolute bottom-0 right-0 w-[92%] translate-x-2 translate-y-2 opacity-95">
        <WeeklyDigestCard />
      </div>
      {/* Middle layer: Offer snapshot */}
      <div className="absolute bottom-8 left-0 z-[1] w-[94%] translate-y-0">
        <OfferSnapshotCard domain={domain} />
      </div>
      {/* Front: Mock alert floating */}
      <MockAlert className="right-0 top-2 z-[2] lg:right-4 lg:top-4" />
    </div>
  )
}
