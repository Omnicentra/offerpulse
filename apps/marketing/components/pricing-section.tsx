"use client"

import { useState } from "react"
import { PricingToggle } from "@/components/pricing-toggle"
import { PricingCards } from "@/components/pricing-cards"
import { PricingComparison } from "@/components/pricing-comparison"

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  return (
    <div className="space-y-12">
      <PricingToggle
        value={billingPeriod}
        onValueChange={setBillingPeriod}
      />
      <PricingCards billingPeriod={billingPeriod} />
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Compare plans
        </h3>
        <PricingComparison />
      </div>
    </div>
  )
}
