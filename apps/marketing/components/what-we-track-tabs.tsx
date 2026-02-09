"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OfferSnapshotCard } from "@/components/offer-snapshot-card"
import { Card, CardContent } from "@/components/ui/card"
import { Tag, Truck, Gift, ShoppingCart, RotateCcw } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

const tabs = [
  { value: "promos", label: "Promos & discounts", icon: Tag },
  { value: "shipping", label: "Free shipping thresholds", icon: Truck },
  { value: "bundles", label: "Bundles & multi-buy", icon: Gift },
  { value: "cart", label: "Cart & checkout incentives", icon: ShoppingCart },
  { value: "delivery", label: "Delivery & returns", icon: RotateCcw },
] as const

const sampleByTab: Record<string, { before: string; after: string; type: string }> = {
  promos: { type: "Promo", before: "No active promo", after: "20% OFF sitewide" },
  shipping: { type: "Shipping threshold", before: "£50", after: "£35" },
  bundles: { type: "Bundle", before: "—", after: "3 for 2 on selected lines" },
  cart: { type: "Cart incentive", before: "—", after: "Spend £10 more for free gift" },
  delivery: { type: "Returns", before: "28 days", after: "30-day returns" },
}

export function WhatWeTrackTabs() {
  const [active, setActive] = useState("promos")
  const sample = sampleByTab[active] ?? sampleByTab.promos

  return (
    <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
      <div className="lg:col-span-3">
        <Tabs value={active} onValueChange={setActive} className="w-full">
          <TabsList className="mb-6 flex h-auto flex-wrap gap-2 rounded-xl bg-muted/60 p-2">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-h-[44px] rounded-lg px-3 py-2.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-soft sm:px-4"
              >
                <tab.icon className="mr-1.5 h-4 w-4 sm:mr-2" aria-hidden />
                <span className="text-xs sm:text-sm">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <Card className="rounded-2xl border-border">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">
                    We track {tab.label.toLowerCase()} across competitor pages. When a change is
                    detected — new offer, threshold change, or removal — you get an alert with
                    before/after proof and a suggested action.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Example: <strong className="text-foreground">{sample.type}</strong> — {sample.before} → {sample.after}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <div className="lg:col-span-2">
        <div className="hidden lg:block lg:sticky lg:top-24">
          <OfferSnapshotCard
            domain="competitor-store.com"
            compact
            sample={sample}
            className="rounded-2xl"
          />
        </div>
      </div>
    </div>
  )
}
