"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Tag, Truck, Gift } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

const summaryStats = [
  { label: "Total changes", value: "12", icon: null },
  { label: "New promos", value: "+4", className: "text-success" },
  { label: "Ended promos", value: "-2", className: "text-warning" },
  { label: "Threshold changes", value: "3", icon: null },
]

const timelineChanges = [
  { domain: "competitor-a.com", change: "Free shipping £50 → £35", time: "Mon 09:00" },
  { domain: "competitor-b.com", change: "New: 20% OFF sitewide", time: "Mon 11:22" },
  { domain: "competitor-a.com", change: "Ended: Flash sale", time: "Tue 08:15" },
  { domain: "competitor-c.com", change: "Bundle: 3 for 2 added", time: "Tue 14:40" },
  { domain: "competitor-b.com", change: "Cart incentive: Spend £10 more for free gift", time: "Wed 10:05" },
]

const offerCategories = [
  { label: "Promos & discounts", count: 4, icon: Tag },
  { label: "Shipping thresholds", count: 3, icon: Truck },
  { label: "Bundles & multi-buy", count: 2, icon: Gift },
]

export function ReportPreview({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-lg",
        className
      )}
    >
      <CardHeader className="border-b border-border bg-muted/30 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">
                Weekly Competitive Pulse
              </h3>
              <p className="text-sm text-body/60">
                Week of 28 Jan — 3 Feb 2025
              </p>
            </div>
          </div>
          <div className="rounded-full border border-primary/30 bg-primary-tint px-3 py-1 text-xs font-medium text-primary">
            Example report
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Summary stats */}
        <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className="border-border p-5 last:border-r-0 sm:border-r"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-body/60">
                {stat.label}
              </p>
              <p
                className={cn(
                  "mt-2 text-2xl font-bold tabular-nums text-ink",
                  stat.className
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          {/* Timeline */}
          <div className="border-border p-6 lg:border-r">
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-body/60">
              Change timeline
            </p>
            <ul className="space-y-2.5">
              {timelineChanges.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <span className="text-xs font-medium text-body/60 shrink-0 w-14">
                    {item.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.domain}
                    </p>
                    <p className="text-xs text-body">
                      {item.change}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Offer categories */}
          <div className="p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Offer categories detected
            </p>
            <div className="space-y-3">
              {offerCategories.map(({ label, count, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {label}
                    </span>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
