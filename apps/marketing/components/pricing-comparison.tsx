"use client"

import { Check } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

const rows = [
  { feature: "Tracked competitors", starter: "5", growth: "10", agency: "Unlimited" },
  { feature: "Weekly digest", starter: true, growth: true, agency: true },
  { feature: "Instant alerts", starter: false, growth: true, agency: true },
  { feature: "Change history", starter: "30 days", growth: "90 days", agency: "Unlimited" },
  { feature: "Offer categories", starter: false, growth: true, agency: true },
  { feature: "Slack integration", starter: false, growth: true, agency: true },
  { feature: "Multi-store", starter: false, growth: false, agency: true },
  { feature: "Support", starter: "Email", growth: "Priority", agency: "Dedicated" },
]

function Cell({
  value,
  className,
}: {
  value: string | boolean
  className?: string
}) {
  if (typeof value === "boolean") {
    return (
      <td
        className={cn(
          "py-3 text-center",
          value ? "text-accent" : "text-muted-foreground",
          className
        )}
      >
        {value ? <Check className="mx-auto h-4 w-4" /> : "—"}
      </td>
    )
  }
  return (
    <td className={cn("py-3 text-center text-sm text-foreground", className)}>
      {value}
    </td>
  )
}

export function PricingComparison() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[320px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-foreground">
              Feature
            </th>
            <th className="px-4 py-3 text-center font-medium text-foreground">
              Starter
            </th>
            <th className="px-4 py-3 text-center font-medium text-foreground">
              Growth
            </th>
            <th className="px-4 py-3 text-center font-medium text-foreground">
              Agency
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.feature} className="hover:bg-muted/20">
              <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
              <Cell value={row.starter} />
              <Cell value={row.growth} />
              <Cell value={row.agency} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
