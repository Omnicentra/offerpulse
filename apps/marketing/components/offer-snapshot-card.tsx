"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Lightbulb } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

interface OfferSnapshotCardProps {
  domain?: string
  /** Compact for product theatre stack */
  compact?: boolean
  className?: string
  /** Override sample change for tabs preview */
  sample?: { type: string; before: string; after: string }
}

const defaultSample = {
  type: "Free shipping threshold",
  before: "£50",
  after: "£35",
}

export function OfferSnapshotCard({
  domain = "competitor-store.com",
  compact = true,
  className,
  sample = defaultSample,
}: OfferSnapshotCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border-border bg-surface shadow-soft",
        compact ? "w-full max-w-sm" : "max-w-md",
        className
      )}
    >
      <CardHeader className="border-b border-border bg-muted/30 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                Offer Snapshot — {domain}
              </p>
              <p className="text-xs text-body/60">Detected change</p>
            </div>
          </div>
          <Badge className="shrink-0 rounded-full border-mint/30 bg-mint-tint px-2 py-0.5 text-xs font-medium text-mint">
            High confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-body/60">
            {sample.type}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-body/60">Before</p>
              <p className="mt-1.5 text-sm font-semibold text-body/70 line-through">
                {sample.before}
              </p>
            </div>
            <div className="rounded-lg border border-mint/30 bg-mint-tint/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-mint/70">After</p>
              <p className="mt-1.5 text-sm font-bold text-mint">
                {sample.after}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-tint/50 p-3 ring-1 ring-amber/20">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          <p className="text-xs leading-relaxed text-body">
            Consider matching the £35 threshold to protect basket size.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
