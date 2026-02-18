"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Clock, Camera, Bell, BarChart3 } from "lucide-react"
import { track } from "@/lib/analytics"

interface FullReportLockedProps {
  competitorUrl: string
}

const lockedFeatures = [
  {
    icon: Clock,
    title: "Offer Timeline",
    description: "See how offers have changed over time with visual diffs.",
  },
  {
    icon: Camera,
    title: "Before/After Screenshots",
    description: "Visual proof of offer changes for stakeholder buy-in.",
  },
  {
    icon: BarChart3,
    title: "Weekly Competitive Pulse",
    description: "Aggregated insights across all your tracked competitors.",
  },
  {
    icon: Bell,
    title: "Alerts & Notifications",
    description: "Get instant alerts via email or Slack when offers change.",
  },
]

export function FullReportLocked({ competitorUrl }: FullReportLockedProps) {
  const encodedUrl = encodeURIComponent(competitorUrl)

  const handleUnlockClick = () => {
    track("cta_signup_clicked", { source: "full_report_locked" })
  }

  return (
    <div className="relative mt-8">
      {/* Blurred preview cards */}
      <div className="grid gap-4 opacity-60 blur-[2px] sm:grid-cols-2">
        {lockedFeatures.map((feature) => (
          <Card key={feature.title} className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-20 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="mx-4 max-w-md border-2 border-primary/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Unlock full tracking
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a free account to access offer timelines, screenshots,
              alerts, and weekly competitive pulse reports.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild size="lg" onClick={handleUnlockClick}>
                <Link href="/snapshot">
                  Create free account to unlock
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required. 14-day free trial on all plans.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
