"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"
import { PRICING_PLANS, PRICING_NOTES, formatMonthlyPrice, formatYearlyPrice } from "@offerpulse/lib/pricing"
import { track } from "@/lib/analytics"
import { buildAppSignupUrl, getStoredCompetitorUrl } from "@offerpulse/lib/routing"

interface PricingCardsProps {
  showFullDescription?: boolean
  billingPeriod?: "monthly" | "annual"
}

export function PricingCards({
  showFullDescription = true,
  billingPeriod = "monthly",
}: PricingCardsProps) {
  const handlePricingClick = (planName: string) => {
    track("cta_signup_clicked", { source: "pricing", plan: planName })
    
    const competitorUrl = getStoredCompetitorUrl()
    const signupUrl = buildAppSignupUrl({
      competitorUrl: competitorUrl || undefined,
      source: "pricing",
    })
    
    window.location.href = signupUrl
  }

  const isAnnual = billingPeriod === "annual"

  return (
    <>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PRICING_PLANS.map((plan) => {
          const price = isAnnual ? plan.yearlyPrice / 10 : plan.monthlyPrice
          const displayPrice = isAnnual ? formatMonthlyPrice(Math.round(price)) : formatMonthlyPrice(price)
        return (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl bg-surface transition-all hover:shadow-soft-lg hover:-translate-y-1",
              plan.popular &&
                "ring-2 ring-primary/40 shadow-glow"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="rounded-full border border-primary/30 bg-primary px-4 py-1 text-xs font-semibold text-white shadow-sm">
                  Most popular
                </div>
              </div>
            )}
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-ink">{plan.name}</CardTitle>
              <p className="mt-2 text-sm text-body">
                {plan.tagline}
              </p>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-ink">{displayPrice}</span>
                </div>
                {isAnnual ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-body">billed annually</p>
                    <p className="text-lg font-semibold text-ink">£{plan.yearlyPrice} per year</p>
                    <p className="text-xs text-green-700">Save £{(plan.monthlyPrice * 12) - plan.yearlyPrice} ({PRICING_NOTES.yearlyDiscount})</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-body">billed monthly</p>
                )}
              </div>
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={cn("mt-0.5 h-5 w-5 shrink-0", feature.included ? "text-mint" : "text-slate-300")} />
                    <span className={cn("text-sm leading-relaxed", feature.included ? "text-body" : "text-body/50")}>
                      {feature.text}
                      {feature.comingSoon && <span className="ml-2 text-xs text-slate-500">(coming soon)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                size="lg"
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handlePricingClick(plan.name)}
              >
                {plan.popular ? "Start free trial" : "Get started"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">{PRICING_NOTES.vat}</p>
    </>
  )
}
