"use client"

import { Mail, MessageSquare, Table2, Send } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

const integrations = [
  { name: "Email", icon: Mail, description: "Alerts in your inbox" },
  { name: "Slack", icon: MessageSquare, description: "Team channels" },
  { name: "Google Sheets", icon: Table2, description: "Export data" },
  { name: "Klaviyo", icon: Send, description: "Audience sync" },
]

export function IntegrationRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-8", className)}>
      {integrations.map(({ name, icon: Icon, description }) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
