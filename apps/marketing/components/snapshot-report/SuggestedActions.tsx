"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Info, Lightbulb, TrendingUp, CheckCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@offerpulse/ui/components/tooltip"

export interface SuggestedAction {
  offerType: "shipping_threshold" | "discount" | "bundle" | "cart_incentive"
  detectedOffer: string
  whyItMatters: string
  recommendations: string[]
  confidence: "high" | "medium" | "low"
}

interface SuggestedActionsProps {
  actions: SuggestedAction[]
}

const confidenceColors = {
  high: "text-green-700 bg-green-50 border-green-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  low: "text-slate-700 bg-slate-50 border-slate-200",
}

const offerTypeLabels = {
  shipping_threshold: "Free Shipping Threshold",
  discount: "Discount Code",
  bundle: "Bundle Offer",
  cart_incentive: "Cart Incentive",
}

export function SuggestedActions({ actions }: SuggestedActionsProps) {
  if (actions.length === 0) return null

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-slate-900">Suggested Actions</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1">
                  <Info className="h-4 w-4 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  <strong className="font-semibold">How we generate suggestions:</strong>
                  <br />
                  Suggestions are heuristic and based on observed promo mechanics. You should
                  validate against your margins and AOV.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <Badge variant="outline" className="mb-2 text-xs">
                  {offerTypeLabels[action.offerType]}
                </Badge>
                <p className="text-sm font-medium text-slate-700">{action.detectedOffer}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${confidenceColors[action.confidence]}`}
              >
                {action.confidence.charAt(0).toUpperCase() + action.confidence.slice(1)}{" "}
                confidence
              </Badge>
            </div>

            {/* Why it matters */}
            <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-900">
                Why this matters
              </p>
              <p className="text-sm text-blue-900">{action.whyItMatters}</p>
            </div>

            {/* Recommendations */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recommended response
              </p>
              <ul className="space-y-2">
                {action.recommendations.map((rec, recIdx) => (
                  <li key={recIdx} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-sm text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Upgrade CTA */}
        <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Get alerts when actions become urgent
              </p>
              <p className="text-xs text-slate-600">
                We'll notify you instantly when competitor offers change, so you can respond
                before conversion drops.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
