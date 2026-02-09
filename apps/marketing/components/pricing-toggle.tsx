"use client"

import { Switch } from "@/components/ui/switch"
import { cn } from "@offerpulse/lib/utils"

interface PricingToggleProps {
  value: "monthly" | "annual"
  onValueChange: (value: "monthly" | "annual") => void
  className?: string
}

export function PricingToggle({ value, onValueChange, className }: PricingToggleProps) {
  const isAnnual = value === "annual"
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      <span
        className={cn(
          "text-sm font-medium",
          !isAnnual ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Monthly
      </span>
      <Switch
        checked={isAnnual}
        onCheckedChange={(checked) => onValueChange(checked ? "annual" : "monthly")}
      />
      <span
        className={cn(
          "text-sm font-medium",
          isAnnual ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Yearly
      </span>
      <span className="badge-pill border-secondary/30 bg-secondary/10 text-secondary text-xs">
        2 months free
      </span>
    </div>
  )
}
