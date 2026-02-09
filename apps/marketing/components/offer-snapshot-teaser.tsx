"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Globe, Clock, FileText, Lightbulb } from "lucide-react"
import { formatTimestamp, getPageTypeDisplay } from "@offerpulse/lib/utils"
import type { PageTypeSlug } from "@offerpulse/lib/utils"
import type { OfferSnapshotResponse } from "@/app/api/offer-snapshot/route"

interface OfferSnapshotTeaserProps {
  data: OfferSnapshotResponse
}

const SIGNAL_LABELS: Record<keyof OfferSnapshotResponse["signals"], string> = {
  promo: "Promos & discounts",
  shippingThreshold: "Free shipping threshold",
  bundle: "Bundles & multi-buy",
  cartIncentive: "Cart & checkout incentives",
  delivery: "Delivery promise",
  returns: "Returns/guarantee",
}

function getStatusClass(status: string): string {
  switch (status) {
    case "Detected":
      return "bg-accent text-accent-foreground border-accent"
    case "Found":
      return "border-2 border-accent bg-transparent text-foreground"
    case "Possible":
      return "bg-warning/10 text-warning border-warning/30"
    case "Not detected":
      return "bg-muted text-muted-foreground border-border"
    case "Not found":
      return "border border-border bg-transparent text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function formatSignalValue(
  key: keyof OfferSnapshotResponse["signals"],
  signal: OfferSnapshotResponse["signals"][keyof OfferSnapshotResponse["signals"]]
): string | null {
  if ("snippet" in signal && signal.snippet) return signal.snippet
  if ("amount" in signal && signal.amount !== undefined)
    return `Free shipping over £${signal.amount}`
  return null
}

export function OfferSnapshotTeaser({ data }: OfferSnapshotTeaserProps) {
  const pageTypeDisplay = getPageTypeDisplay(data.pageType as PageTypeSlug)
  const signalEntries = Object.entries(data.signals) as [
    keyof OfferSnapshotResponse["signals"],
    OfferSnapshotResponse["signals"][keyof OfferSnapshotResponse["signals"]],
  ][]

  return (
    <Card className="w-full overflow-hidden border-2 border-border">
      <CardHeader className="border-b border-border bg-muted/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            Offer Snapshot (Today)
          </CardTitle>
          <Badge variant="secondary" className="w-fit">
            Preview
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="font-medium text-foreground">{data.domain}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>{pageTypeDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatTimestamp(new Date(data.capturedAt))}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-4">
          {signalEntries.map(([key, signal], index) => {
            const label = SIGNAL_LABELS[key]
            const value = formatSignalValue(key, signal)
            return (
              <div key={key}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {label}
                      </span>
                      <Badge
                        variant="outline"
                        className={getStatusClass(signal.status)}
                      >
                        {signal.status}
                      </Badge>
                    </div>
                    {value && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
                {index < signalEntries.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg bg-amber-tint/50 p-4 ring-1 ring-amber/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Why it matters
              </p>
              <p className="mt-1 text-sm leading-relaxed text-body">
                {data.whyItMatters}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
