"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, Lightbulb } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

interface HeroSnapshotCardProps {
  /** Domain to show in header; when user pastes a URL we can derive and pass this for a partial preview */
  domain?: string
  className?: string
}

const defaultDomain = "competitor-store.com"

const detectedChanges = [
  {
    type: "Promo",
    before: "No active promo",
    after: "20% OFF sitewide",
    variant: "promo" as const,
  },
  {
    type: "Shipping threshold",
    before: "Free shipping over £50",
    after: "Free shipping over £35",
    variant: "shipping" as const,
  },
  {
    type: "Bundle",
    before: "—",
    after: "3 for 2 on selected lines",
    variant: "bundle" as const,
  },
]

export function HeroSnapshotCard({ domain = defaultDomain, className }: HeroSnapshotCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-border bg-card shadow-lg",
        className
      )}
    >
      <CardHeader className="border-b border-border bg-muted/40 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Offer Snapshot — {domain}
              </p>
              <p className="text-xs text-muted-foreground">Preview</p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            High confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Detected changes */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Detected changes
          </p>
          <div className="space-y-3">
            {detectedChanges.map((change) => (
              <div
                key={change.type}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {change.type}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded border border-border/80 bg-background p-2">
                    <p className="text-[10px] text-muted-foreground">Before</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground line-through">
                      {change.before}
                    </p>
                  </div>
                  <div className="rounded border border-accent/30 bg-accent/5 p-2">
                    <p className="text-[10px] text-accent">After</p>
                    <p className="mt-0.5 truncate text-xs font-medium text-foreground">
                      {change.after}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested action */}
        <div className="flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-xs font-medium text-foreground">
              Suggested action
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Consider matching the £35 free shipping threshold to protect basket size.
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Captured today — generate full report to track over time</span>
        </div>
      </CardContent>
    </Card>
  )
}
