"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PRICING_PLANS, PRICING_NOTES, formatMonthlyPrice } from "@offerpulse/lib/pricing";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const currentPlanId = "starter"; // Mock - in production, get from user subscription

  const isAnnual = billingPeriod === "annual";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Manage your plan and subscription"
      />

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              !isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PRICING_PLANS.map((plan) => {
          const price = isAnnual ? plan.yearlyPrice / 10 : plan.monthlyPrice;
          const displayPrice = formatMonthlyPrice(Math.round(price));
          const isCurrentPlan = plan.id === currentPlanId;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.popular && "ring-2 ring-blue-600 shadow-lg",
                isCurrentPlan && "ring-2 ring-green-600"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600">Most popular</Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-600">Current plan</Badge>
                </div>
              )}

              <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{displayPrice}</span>
                  </div>
                  {isAnnual ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-slate-600">billed annually</p>
                      <p className="text-base font-semibold text-slate-900">£{plan.yearlyPrice} per year</p>
                      <p className="text-xs text-green-700">
                        Save £{plan.monthlyPrice * 12 - plan.yearlyPrice} ({PRICING_NOTES.yearlyDiscount})
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">billed monthly</p>
                  )}
                </div>

                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 flex-shrink-0",
                          feature.included ? "text-green-600" : "text-slate-300"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          feature.included ? "text-slate-700" : "text-slate-400"
                        )}
                      >
                        {feature.text}
                        {feature.comingSoon && (
                          <span className="ml-1 text-xs text-slate-500">(coming soon)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
                  className="w-full"
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Current plan" : plan.popular ? "Upgrade to " + plan.name : "Select " + plan.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-600">{PRICING_NOTES.vat}</p>

      {/* Current Usage */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Current Usage</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Competitors Tracked</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">3 / 5</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Changes This Month</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">47</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Seats Used</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">1 / 1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
