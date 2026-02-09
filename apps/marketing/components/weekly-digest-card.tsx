"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

const stats = [
  { label: "Total changes", value: "12" },
  { label: "New promos", value: "+4", highlight: "success" },
  { label: "Ended promos", value: "-2", highlight: "warning" },
  { label: "Threshold changes", value: "3" },
]

interface WeeklyDigestCardProps {
  className?: string
  compact?: boolean
}

export function WeeklyDigestCard({ className, compact = true }: WeeklyDigestCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border-border bg-surface shadow-soft",
        compact ? "max-w-sm" : "max-w-md",
        className
      )}
    >
      <CardHeader className="border-b border-border bg-muted/30 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink">
              Weekly Competitive Pulse
            </p>
            <p className="text-xs text-body/60">Week of 28 Jan</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-muted/40 px-3 py-2.5"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-body/60">{s.label}</p>
              <p
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums",
                  s.highlight === "success" && "text-mint",
                  s.highlight === "warning" && "text-amber",
                  !s.highlight && "text-ink"
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
