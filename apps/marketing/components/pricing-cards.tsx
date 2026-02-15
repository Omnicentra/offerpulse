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
import posthog from "posthog-js"

interface PricingCardsProps {
  showFullDescription?: boolean
  billingPeriod?: "monthly" | "annual"
}

export function PricingCards({
  showFullDescription = true,
  billingPeriod = "monthly",
}: PricingCardsProps) {
  const handlePricingClick = (planName: string, price: number) => {
    track("cta_signup_clicked", { source: "pricing", plan: planName })

    // Track pricing plan selection in PostHog
    posthog.capture("pricing_plan_selected", {
      plan_name: planName,
      billing_period: billingPeriod,
      price,
      currency: "GBP",
      source: "pricing_page",
    })

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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {PRICING_PLANS.map((plan) => {
          const price = isAnnual ? plan.yearlyPrice / 10 : plan.monthlyPrice
          
          return (
            <Card
              key={plan.name}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border-2 transition-all hover:shadow-lg hover:-translate-y-1",
                plan.popular
                  ? "border-blue-500 shadow-lg"
                  : "border-slate-200"
              )}
            >
              {/* Most Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 px-4 py-1 text-xs font-semibold">
                    Most popular
                  </Badge>
                </div>
              )}

              {/* Header */}
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-3xl font-bold text-slate-900">{plan.name}</CardTitle>
                <p className="mt-2 text-sm text-slate-600">
                  {plan.tagline}
                </p>
              </CardHeader>

              {/* Price */}
              <CardContent className="flex-1 space-y-8 pb-8">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900">£{Math.round(price)}</span>
                    <span className="text-lg text-slate-600">/mo</span>
                  </div>
                  {isAnnual ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-slate-600">billed annually</p>
                      <p className="text-base font-semibold text-slate-900">£{plan.yearlyPrice} per year</p>
                      <p className="text-sm text-green-700">
                        Save £{(plan.monthlyPrice * 12) - plan.yearlyPrice} ({PRICING_NOTES.yearlyDiscount})
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">billed monthly</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check
                        className={cn(
                          "mt-0.5 h-5 w-5 flex-shrink-0",
                          feature.included ? "text-green-600" : "text-slate-300"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm leading-relaxed",
                          feature.included ? "text-slate-700" : "text-slate-400"
                        )}
                      >
                        {feature.text}
                        {feature.comingSoon && (
                          <Badge variant="outline" className="ml-2 text-xs text-slate-500">
                            coming soon
                          </Badge>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* CTA - Pinned to bottom */}
              <CardFooter className="pb-8 pt-0">
                <Button
                  size="lg"
                  className="h-12 w-full text-base font-semibold"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handlePricingClick(plan.name, price)}
                >
                  {plan.popular ? "Start free trial" : "Get started"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-slate-600">{PRICING_NOTES.vat}</p>
    </>
  )
}
