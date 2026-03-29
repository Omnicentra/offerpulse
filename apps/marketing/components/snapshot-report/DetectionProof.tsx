"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CheckCircle, AlertTriangle, Eye, Globe, ShoppingCart, FileText } from "lucide-react"

interface Evidence {
  location: string
  confidence: "high" | "medium" | "low"
  reason: string
  snippet?: string
  pageUrl: string
  icon?: typeof Globe
}

interface DetectedItem {
  title: string
  evidence: Evidence[]
}

interface DetectionProofProps {
  pagesScanned: string[]
  lastScanned: string
  detectedItems: DetectedItem[]
}

const confidenceColors = {
  high: "text-green-700 bg-green-50 border-green-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  low: "text-slate-700 bg-slate-50 border-slate-200",
}

const confidenceIcons = {
  high: CheckCircle,
  medium: AlertTriangle,
  low: Eye,
}

const locationIcons: Record<string, typeof Globe> = {
  "Announcement bar": Globe,
  "Product page": ShoppingCart,
  "Cart drawer": ShoppingCart,
  "Shipping policy": FileText,
  "Checkout page": ShoppingCart,
}

export function DetectionProof({ pagesScanned, lastScanned, detectedItems }: DetectionProofProps) {
  const [expandedItem, setExpandedItem] = useState<string | undefined>(undefined)

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-slate-900">Detection Proof</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs">
            SEOptimiser-style transparency
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pages scanned
            </p>
            <div className="mt-2 space-y-1">
              {pagesScanned.map((page, i) => (
                <p key={i} className="text-sm text-slate-700">
                  {page}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Last scanned
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{lastScanned}</p>
            <p className="mt-1 text-xs text-slate-500">
              Public pages only (checkout inferred from cart/shipping policy)
            </p>
          </div>
        </div>

        {/* Evidence for each detected item */}
        <Accordion
          type="single"
          collapsible
          value={expandedItem}
          onValueChange={setExpandedItem}
          className="space-y-2"
        >
          {detectedItems.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="rounded-lg border border-slate-200 bg-white px-4"
            >
              <AccordionTrigger className="text-sm font-medium text-slate-900 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span>{item.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.evidence.length} source{item.evidence.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                {item.evidence.map((ev, evIdx) => {
                  const ConfidenceIcon = confidenceIcons[ev.confidence]
                  const LocationIcon = locationIcons[ev.location] || Globe

                  return (
                    <div
                      key={evIdx}
                      className="rounded-md border border-slate-100 bg-slate-50/50 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <LocationIcon className="mt-0.5 h-4 w-4 text-slate-500" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{ev.location}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${confidenceColors[ev.confidence]}`}
                            >
                              <ConfidenceIcon className="mr-1 h-3 w-3" />
                              {ev.confidence.charAt(0).toUpperCase() + ev.confidence.slice(1)}{" "}
                              confidence
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">{ev.reason}</p>
                          {ev.snippet && (
                            <div className="rounded border border-slate-200 bg-white p-2">
                              <p className="font-mono text-xs text-slate-700">{ev.snippet}</p>
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            Source: <span className="font-medium">{ev.pageUrl}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Disclaimer */}
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-900">
            <strong className="font-semibold">Note:</strong> Checkout monitoring is limited to
            public pages. Cart and shipping policy pages may contain checkout incentives. Full
            checkout detection requires authenticated access.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
