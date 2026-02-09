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
import { track } from "@/lib/analytics"
import { buildAppSignupUrl, getStoredCompetitorUrl } from "@offerpulse/lib/routing"

const plans = [
  {
    name: "Starter",
    priceMonthly: 19,
    bestFor: "Solo operators getting started",
    description: "For solo operators getting started.",
    features: ["5 competitors", "Weekly digest", "Change history"],
    popular: false,
  },
  {
    name: "Growth",
    priceMonthly: 49,
    bestFor: "Growing brands who need to stay ahead",
    description: "For growing brands who need to stay ahead.",
    features: ["10 competitors", "Instant alerts", "Weekly digest", "Offer categories"],
    popular: true,
  },
  {
    name: "Agency",
    priceMonthly: 99,
    bestFor: "Agencies managing multiple client stores",
    description: "For agencies managing multiple client stores.",
    features: ["Multi-store", "Client reporting", "Team seats"],
    popular: false,
  },
]

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
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const price = isAnnual
          ? Math.round(plan.priceMonthly * 0.8)
          : plan.priceMonthly
        const period = isAnnual ? "/mo" : "/mo"
        const subLabel = isAnnual ? "billed annually" : null
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
                {plan.bestFor}
              </p>
              {showFullDescription && (
                <CardDescription>{plan.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-ink">£{price}</span>
                  <span className="text-lg text-body">{period}</span>
                </div>
                {isAnnual ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-body">billed annually</p>
                    <p className="text-lg font-semibold text-ink">£{price * 12} per year</p>
                  </div>
                ) : (
                  subLabel && <p className="mt-2 text-sm text-body">{subLabel}</p>
                )}
              </div>
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
                    <span className="text-sm leading-relaxed text-body">{feature}</span>
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
        )
      })}
    </div>
  )
}
